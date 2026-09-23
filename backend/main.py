from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
import joblib
import numpy as np
import json
from datetime import date, datetime, time

from database import SessionLocal
from models import User, HealthRecord, Prediction
from schemas import UserCreate, UserLogin, UserOut, Token
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_id,
    security,
)
from training import (
    deploy_model,
    get_job,
    get_latest_completed,
    job_counts,
    job_model_scores,
    latest_completed_job_id,
    model_labels,
    start_training,
    valid_model_ids,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    user_id = get_current_user_id(credentials=credentials)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_role(*roles: str):
    def dependency(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Requires role: {', '.join(roles)}",
            )
        return user

    return dependency


VALID_ROLES = ("patient", "provider", "admin")


model = joblib.load('../ml/models/diabetes_model.pkl')
scaler = joblib.load('../ml/models/scaler.pkl')

with open('../ml/models/medians.json') as f:
    medians = json.load(f)

DEPLOYED_MODEL = {
    "model_id": "neural",
    "label": "Neural Network",
    "model_type": str(type(model).__name__),
}


class PatientData(BaseModel):
    Pregnancies: int
    Glucose: float
    BloodPressure: float
    SkinThickness: float
    Insulin: float
    BMI: float
    DiabetesPedigree: float
    Age: int


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class TrainRequest(BaseModel):
    models: list[str] = ["neural", "svm", "dt", "lr"]


class DeployRequest(BaseModel):
    job_id: str
    model: str


@app.get("/")
def read_root():
    return {"message": "Diabetes Risk Predictor API is running"}


@app.get("/model-check")
def model_check():
    return {"model_loaded": True, "model_type": str(type(model).__name__)}


@app.post("/admin/train")
def admin_train(
    payload: TrainRequest,
    user: User = Depends(require_role("admin")),
):
    valid = valid_model_ids()
    unknown = [mid for mid in payload.models if mid not in valid]
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown model ids: {unknown}")
    return start_training(payload.models)


@app.get("/admin/train/{job_id}")
def admin_train_status(
    job_id: str,
    user: User = Depends(require_role("admin")),
):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Training job not found")
    return job


@app.get("/admin/models/latest")
def admin_latest_models(
    user: User = Depends(require_role("admin")),
):
    job = get_latest_completed()
    if not job:
        raise HTTPException(status_code=404, detail="No completed training jobs yet")
    return job


@app.post("/admin/deploy")
def admin_deploy(
    payload: DeployRequest,
    user: User = Depends(require_role("admin")),
):
    global model, scaler

    if payload.model not in model_labels():
        raise HTTPException(status_code=422, detail=f"Unknown model id: {payload.model}")

    try:
        new_model, new_scaler = deploy_model(payload.job_id, payload.model)
    except LookupError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    model = new_model
    scaler = new_scaler
    DEPLOYED_MODEL.update(
        {
            "model_id": payload.model,
            "label": model_labels()[payload.model],
            "model_type": str(type(new_model).__name__),
        }
    )

    return {
        "message": f"Deployed {model_labels()[payload.model]} to production",
        "model_id": payload.model,
        "model_label": model_labels()[payload.model],
        "model_type": str(type(new_model).__name__),
    }


@app.post("/predict")
def predict(
    patient: PatientData,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    data = patient.dict()

    for col in ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']:
        if data[col] == 0:
            data[col] = medians[col]

    input_data = np.array([[
        data['Pregnancies'], data['Glucose'], data['BloodPressure'],
        data['SkinThickness'], data['Insulin'], data['BMI'],
        data['DiabetesPedigree'], data['Age']
    ]])

    input_scaled = scaler.transform(input_data)
    prediction = model.predict(input_scaled)[0]
    probability = model.predict_proba(input_scaled)[0][1]

    health_record = HealthRecord(
        user_id=user_id,
        pregnancies=data['Pregnancies'],
        glucose=data['Glucose'],
        blood_pressure=data['BloodPressure'],
        skin_thickness=data['SkinThickness'],
        insulin=data['Insulin'],
        bmi=data['BMI'],
        diabetes_pedigree=data['DiabetesPedigree'],
        age=data['Age']
    )
    db.add(health_record)
    db.commit()
    db.refresh(health_record)

    prediction_record = Prediction(
        health_record_id=health_record.id,
        prediction=int(prediction),
        risk_probability=round(float(probability), 4)
    )
    db.add(prediction_record)
    db.commit()

    return {
        "prediction": int(prediction),
        "risk_label": "Diabetic" if prediction == 1 else "Not Diabetic",
        "risk_probability": round(float(probability), 4),
        "health_record_id": health_record.id
    }


@app.get("/predictions")
def get_predictions(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    rows = (
        db.query(Prediction, HealthRecord)
        .join(HealthRecord, Prediction.health_record_id == HealthRecord.id)
        .filter(HealthRecord.user_id == user_id)
        .order_by(Prediction.created_at.desc())
        .all()
    )
    return [
        {
            "prediction_id": pred.id,
            "date": pred.created_at.isoformat(),
            "prediction": pred.prediction,
            "risk_probability": pred.risk_probability,
            "risk_label": "Diabetic" if pred.prediction == 1 else "Not Diabetic",
            "glucose": rec.glucose,
            "blood_pressure": rec.blood_pressure,
            "skin_thickness": rec.skin_thickness,
            "insulin": rec.insulin,
            "bmi": rec.bmi,
            "diabetes_pedigree": rec.diabetes_pedigree,
            "age": rec.age,
            "pregnancies": rec.pregnancies,
        }
        for pred, rec in rows
    ]


@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user.email,
        hashed_password=hash_password(user.password),
        full_name=user.full_name,
        role=user.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully", "user_id": new_user.id}


@app.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user


FACTOR_LABELS = {
    "Pregnancies": "Pregnancies",
    "Glucose": "Glucose (mg/dL)",
    "BloodPressure": "Blood Pressure (mmHg)",
    "SkinThickness": "Skin Thickness (mm)",
    "Insulin": "Insulin",
    "BMI": "BMI",
    "DiabetesPedigree": "Pedigree Function",
    "Age": "Age (years)",
}

FACTOR_CAPS = {
    "Pregnancies": 12,
    "Glucose": 200,
    "BloodPressure": 120,
    "SkinThickness": 60,
    "Insulin": 250,
    "BMI": 40,
    "DiabetesPedigree": 2.3,
    "Age": 80,
}


def _risk_level(probability: float) -> str:
    if probability < 0.33:
        return "low"
    if probability < 0.66:
        return "moderate"
    return "high"


@app.get("/provider/overview")
def provider_overview(
    user: User = Depends(require_role("provider", "admin")),
    db: Session = Depends(get_db),
):
    today_start = datetime.combine(date.today(), time.min)

    rows = (
        db.query(User, HealthRecord, Prediction)
        .join(HealthRecord, HealthRecord.user_id == User.id)
        .join(Prediction, Prediction.health_record_id == HealthRecord.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )

    patients = {}
    predictions_today = 0
    for account, rec, pred in rows:
        if pred.created_at and pred.created_at >= today_start:
            predictions_today += 1
        if account.id in patients:
            continue
        patients[account.id] = {
            "id": account.id,
            "name": account.full_name or account.email,
            "email": account.email,
            "age": rec.age,
            "last_check": pred.created_at.isoformat() if pred.created_at else None,
            "glucose": rec.glucose,
            "bmi": rec.bmi,
            "probability": pred.risk_probability,
            "risk": _risk_level(pred.risk_probability),
        }

    patient_list = sorted(
        patients.values(), key=lambda p: p["last_check"] or "", reverse=True
    )
    total = len(patient_list)
    high = sum(1 for p in patient_list if p["risk"] == "high")
    moderate = sum(1 for p in patient_list if p["risk"] == "moderate")
    low = sum(1 for p in patient_list if p["risk"] == "low")
    avg = round(sum(p["probability"] for p in patient_list) / total, 4) if total else 0

    return {
        "total_patients": total,
        "predictions_today": predictions_today,
        "high_risk": high,
        "moderate_risk": moderate,
        "low_risk": low,
        "avg_risk": avg,
        "patients": patient_list,
    }


@app.get("/provider/patients/{patient_id}")
def provider_patient_detail(
    patient_id: int,
    user: User = Depends(require_role("provider", "admin")),
    db: Session = Depends(get_db),
):
    account = db.query(User).filter(User.id == patient_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Patient not found")

    recs = (
        db.query(HealthRecord, Prediction)
        .join(Prediction, Prediction.health_record_id == HealthRecord.id)
        .filter(HealthRecord.user_id == patient_id)
        .order_by(Prediction.created_at.asc())
        .all()
    )
    if not recs:
        raise HTTPException(status_code=404, detail="No predictions yet for this patient")

    rec, pred = recs[-1]

    def _field(value, key):
        return value if value not in (None, 0) else medians.get(key, value)

    raw_row = [
        rec.pregnancies if rec.pregnancies is not None else 0,
        _field(rec.glucose, "Glucose"),
        _field(rec.blood_pressure, "BloodPressure"),
        _field(rec.skin_thickness, "SkinThickness"),
        _field(rec.insulin, "Insulin"),
        _field(rec.bmi, "BMI"),
        rec.diabetes_pedigree if rec.diabetes_pedigree is not None else 0,
        rec.age if rec.age is not None else 0,
    ]

    features = {
        "Pregnancies": raw_row[0],
        "Glucose": raw_row[1],
        "BloodPressure": raw_row[2],
        "SkinThickness": raw_row[3],
        "Insulin": raw_row[4],
        "BMI": raw_row[5],
        "DiabetesPedigree": raw_row[6],
        "Age": raw_row[7],
    }
    factors = []
    for feat, value in features.items():
        impact = max(5, min(100, round(float(value) / FACTOR_CAPS[feat] * 100)))
        fill = "#C0453A" if impact >= 60 else "#C8821A" if impact >= 30 else "#2A9E6B"
        factors.append({"name": FACTOR_LABELS[feat], "impact": impact, "fill": fill, "value": float(value)})

    latest_job_id = latest_completed_job_id()
    model_scores = job_model_scores(latest_job_id, raw_row) if latest_job_id else None

    return {
        "id": account.id,
        "name": account.full_name or account.email,
        "email": account.email,
        "age": rec.age,
        "last_check": pred.created_at.isoformat() if pred.created_at else None,
        "prediction": pred.prediction,
        "risk_probability": pred.risk_probability,
        "risk_label": "Diabetic" if pred.prediction == 1 else "Not Diabetic",
        "glucose": rec.glucose,
        "blood_pressure": rec.blood_pressure,
        "skin_thickness": rec.skin_thickness,
        "insulin": rec.insulin,
        "bmi": rec.bmi,
        "diabetes_pedigree": rec.diabetes_pedigree,
        "pregnancies": rec.pregnancies,
        "factors": factors,
        "history": [
            {
                "date": p.created_at.isoformat() if p.created_at else None,
                "risk_probability": p.risk_probability,
                "prediction": p.prediction,
            }
            for _rec, p in recs[-8:]
        ],
        "model_scores": model_scores,
    }


@app.get("/admin/overview")
def admin_overview(
    user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_predictions = db.query(func.count(Prediction.id)).scalar() or 0

    return {
        "total_users": total_users,
        "total_predictions": total_predictions,
        "jobs": job_counts(),
        "deployed_model": DEPLOYED_MODEL,
        "latest_job_id": latest_completed_job_id(),
    }
def get_me(user: User = Depends(get_current_user)):
    return user


@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": str(db_user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@app.put("/change-password")
def change_password(
    payload: ChangePassword,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(payload.current_password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    db_user.hashed_password = hash_password(payload.new_password)
    db.commit()

    return {"message": "Password updated successfully"}