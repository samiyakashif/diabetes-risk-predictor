from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import joblib
import numpy as np
import json

from database import SessionLocal
from models import User, HealthRecord, Prediction
from schemas import UserCreate, UserLogin, Token
from auth import hash_password, verify_password, create_access_token, get_current_user_id
from training import (
    deploy_model,
    get_job,
    get_latest_completed,
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


model = joblib.load('../ml/models/diabetes_model.pkl')
scaler = joblib.load('../ml/models/scaler.pkl')

with open('../ml/models/medians.json') as f:
    medians = json.load(f)


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
    user_id: int = Depends(get_current_user_id),
):
    valid = valid_model_ids()
    unknown = [mid for mid in payload.models if mid not in valid]
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown model ids: {unknown}")
    return start_training(payload.models)


@app.get("/admin/train/{job_id}")
def admin_train_status(
    job_id: str,
    user_id: int = Depends(get_current_user_id),
):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Training job not found")
    return job


@app.get("/admin/models/latest")
def admin_latest_models(
    user_id: int = Depends(get_current_user_id),
):
    job = get_latest_completed()
    if not job:
        raise HTTPException(status_code=404, detail="No completed training jobs yet")
    return job


@app.post("/admin/deploy")
def admin_deploy(
    payload: DeployRequest,
    user_id: int = Depends(get_current_user_id),
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
        full_name=user.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully", "user_id": new_user.id}


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