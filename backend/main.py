from fastapi import FastAPI, Depends, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
import csv
import io
import joblib
import numpy as np
import json
from datetime import date, datetime, time

from database import SessionLocal
from models import User, HealthRecord, Prediction, GeneratedReport
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


REPORT_TYPES = {
    "patient": ["individual_risk", "monthly_summary"],
    "provider": ["panel_overview", "clinical_insights"],
    "admin": ["model_performance", "system_usage", "user_analytics", "training_summary"],
}

REPORT_TITLES = {
    "individual_risk": "Individual Risk Report",
    "monthly_summary": "Monthly Prediction Summary",
    "panel_overview": "Provider Panel Overview",
    "clinical_insights": "Clinical Insights",
    "model_performance": "Model Performance Report",
    "system_usage": "System Usage Report",
    "user_analytics": "User Analytics Report",
    "training_summary": "Training Summary Report",
}

FACTOR_UNITS = {
    "Pregnancies": "",
    "Glucose": " mg/dL",
    "BloodPressure": " mmHg",
    "SkinThickness": " mm",
    "Insulin": " µU/mL",
    "BMI": "",
    "DiabetesPedigree": "",
    "Age": " yrs",
}


def _fmt(value, suffix="", digits=1):
    if value is None:
        return "Not recorded"
    if isinstance(value, float):
        if value.is_integer():
            return f"{int(value)}{suffix}"
        return f"{value:.{digits}f}{suffix}"
    return f"{value}{suffix}"


def _field_value(value, key):
    return value if value not in (None, 0) else medians.get(key, None)


def _parse_report_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid date: {value}")


def _get_owned_report(report_id: int, user: User, db: Session) -> GeneratedReport:
    report = db.query(GeneratedReport).filter(GeneratedReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.owner_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this report")
    return report


def _summary_to_csv(summary: dict) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([f"DiabetaAI - {summary['title']}"])
    writer.writerow(["Generated", summary.get("generated_at", "")])
    writer.writerow(["Prepared for", summary.get("owner", "")])
    writer.writerow([])
    for section in summary.get("sections", []):
        writer.writerow([section["title"]])
        writer.writerow(["Field", "Value"])
        for row in section.get("rows", []):
            writer.writerow([row["label"], row["value"]])
        writer.writerow([])
    return buffer.getvalue()


def _latest_prediction_row(db: Session, user_id: int):
    return (
        db.query(Prediction, HealthRecord)
        .join(HealthRecord, Prediction.health_record_id == HealthRecord.id)
        .filter(HealthRecord.user_id == user_id)
        .order_by(Prediction.created_at.desc())
        .first()
    )


def _prediction_rows(db: Session, user_id: int, start: date | None = None, end: date | None = None):
    rows = (
        db.query(Prediction, HealthRecord)
        .join(HealthRecord, Prediction.health_record_id == HealthRecord.id)
        .filter(HealthRecord.user_id == user_id)
        .order_by(Prediction.created_at.asc())
        .all()
    )
    if start or end:
        rows = [
            (p, r)
            for p, r in rows
            if p.created_at
            and (not start or p.created_at.date() >= start)
            and (not end or p.created_at.date() <= end)
        ]
    return rows


def _patient_factor_rows(rec: HealthRecord) -> list[dict]:
    values = {
        "Pregnancies": rec.pregnancies,
        "Glucose": rec.glucose,
        "BloodPressure": rec.blood_pressure,
        "SkinThickness": rec.skin_thickness,
        "Insulin": rec.insulin,
        "BMI": rec.bmi,
        "DiabetesPedigree": rec.diabetes_pedigree,
        "Age": rec.age,
    }
    rows = []
    for feat, raw in values.items():
        val = raw if raw not in (None, 0) else None
        rows.append({
            "label": FACTOR_LABELS[feat],
            "value": _fmt(val, FACTOR_UNITS[feat]),
        })
    return rows


def _build_patient_report(report_type: str, user: User, db: Session, start: date | None, end: date | None) -> dict:
    owner = user.full_name or user.email
    base = {
        "generated_at": datetime.utcnow().isoformat(),
        "owner": owner,
        "role": user.role,
    }

    if report_type == "individual_risk":
        latest = _latest_prediction_row(db, user.id)
        if not latest:
            raise HTTPException(status_code=404, detail="No predictions yet — run a risk assessment first")
        pred, rec = latest
        prob = pred.risk_probability or 0
        return {
            **base,
            "title": REPORT_TITLES[report_type],
            "sections": [
                {"title": "Patient Information", "rows": [
                    {"label": "Name", "value": owner},
                    {"label": "Email", "value": user.email},
                ]},
                {"title": "Risk Assessment", "rows": [
                    {"label": "Risk Level", "value": _risk_level(prob).title()},
                    {"label": "Risk Probability", "value": f"{prob * 100:.1f}%"},
                    {"label": "Classification", "value": "Diabetic" if pred.prediction == 1 else "Not Diabetic"},
                    {"label": "Assessment Date", "value": pred.created_at.strftime("%Y-%m-%d %H:%M") if pred.created_at else "—"},
                ]},
                {"title": "Latest Health Factors", "rows": _patient_factor_rows(rec)},
            ],
        }

    rows = _prediction_rows(db, user.id, start, end)
    if not rows:
        raise HTTPException(status_code=404, detail="No predictions in the selected period")
    probs = [p.risk_probability or 0 for p, _ in rows]
    avg = sum(probs) / len(probs)
    delta = probs[-1] - probs[0]
    trend = "increasing" if delta > 0.02 else "decreasing" if delta < -0.02 else "stable"
    entries = [
        {
            "label": p.created_at.strftime("%Y-%m-%d") if p.created_at else "—",
            "value": f"{(p.risk_probability or 0) * 100:.1f}% ({'Diabetic' if p.prediction == 1 else 'Not Diabetic'})",
        }
        for p, _ in rows[-12:]
    ]
    return {
        **base,
        "title": REPORT_TITLES[report_type],
        "sections": [
            {"title": "Monthly Summary", "rows": [
                {"label": "Risk Checks", "value": str(len(rows))},
                {"label": "Average Risk", "value": f"{avg * 100:.1f}%"},
                {"label": "Risk Trend", "value": trend},
            ]},
            {"title": "Recent Predictions", "rows": entries},
        ],
    }


def _provider_panel(db: Session) -> dict:
    rows = (
        db.query(User, HealthRecord, Prediction)
        .join(HealthRecord, HealthRecord.user_id == User.id)
        .join(Prediction, Prediction.health_record_id == HealthRecord.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )
    patients = {}
    for account, _rec, pred in rows:
        if account.id in patients:
            continue
        patients[account.id] = {
            "name": account.full_name or account.email,
            "email": account.email,
            "prob": pred.risk_probability or 0,
            "level": _risk_level(pred.risk_probability or 0),
            "last": pred.created_at.strftime("%Y-%m-%d") if pred.created_at else None,
        }
    return dict(
        sorted(patients.items(), key=lambda kv: kv[1]["prob"], reverse=True)
    )


def _build_provider_report(report_type: str, user: User, db: Session) -> dict:
    base = {
        "generated_at": datetime.utcnow().isoformat(),
        "owner": user.full_name or user.email,
        "role": user.role,
        "title": REPORT_TITLES[report_type],
    }
    panel = _provider_panel(db)
    total = len(panel)
    high = sum(1 for p in panel.values() if p["level"] == "high")
    moderate = sum(1 for p in panel.values() if p["level"] == "moderate")
    low = sum(1 for p in panel.values() if p["level"] == "low")
    avg = round(sum(p["prob"] for p in panel.values()) / total, 4) if total else 0

    if report_type == "panel_overview":
        return {
            **base,
            "sections": [
                {"title": "Panel Summary", "rows": [
                    {"label": "Patients in Panel", "value": str(total)},
                    {"label": "High Risk", "value": str(high)},
                    {"label": "Moderate Risk", "value": str(moderate)},
                    {"label": "Low Risk", "value": str(low)},
                    {"label": "Average Risk", "value": f"{avg * 100:.1f}%" if total else "—"},
                ]},
                {"title": "Top-Risk Patients", "rows": (
                    [
                        {"label": p["name"], "value": f"{(p['prob']) * 100:.1f}% · {p['level'].title()} · {p['last']}"}
                        for p in list(panel.values())[:5]
                    ] or [{"label": "—", "value": "No patients yet"}]
                )},
            ],
        }

    latest_by_user: dict[int, dict] = {}
    rows = (
        db.query(User, HealthRecord, Prediction)
        .join(HealthRecord, HealthRecord.user_id == User.id)
        .join(Prediction, Prediction.health_record_id == HealthRecord.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )
    for account, rec, pred in rows:
        if account.id not in latest_by_user:
            latest_by_user[account.id] = {"rec": rec, "pred": pred}
    records = [v["rec"] for v in latest_by_user.values()]

    def mean(attr):
        values = [getattr(r, attr) for r in records if getattr(r, attr) not in (None, 0)]
        return round(sum(values) / len(values), 1) if values else None

    bmi_30 = sum(1 for r in records if r.bmi is not None and r.bmi >= 30)
    glucose_126 = sum(1 for r in records if r.glucose is not None and r.glucose >= 126)
    return {
        **base,
        "sections": [
            {"title": "Clinical Insights", "rows": [
                {"label": "Patients with Predictions", "value": str(len(records))},
                {"label": "Average Glucose", "value": _fmt(mean("glucose"), " mg/dL")},
                {"label": "Average BMI", "value": _fmt(mean("bmi"))},
                {"label": "Average Age", "value": _fmt(mean("age"), " yrs", digits=0)},
                {"label": "Patients with BMI ≥ 30", "value": str(bmi_30)},
                {"label": "Patients with Glucose ≥ 126", "value": str(glucose_126)},
            ]},
        ],
    }


def _role_counts(db: Session) -> dict:
    return {role: db.query(User).filter(User.role == role).count() for role in VALID_ROLES}


def _build_admin_report(report_type: str, user: User, db: Session) -> dict:
    base = {
        "generated_at": datetime.utcnow().isoformat(),
        "owner": user.full_name or user.email,
        "role": user.role,
        "title": REPORT_TITLES[report_type],
    }

    if report_type == "model_performance":
        job = get_latest_completed()
        if not job:
            return {
                **base,
                "sections": [{"title": "Model Performance",
                              "rows": [{"label": "Status", "value": "No completed training jobs yet"}]}],
            }
        rows = [
            {"label": m.get("label", m.get("id", "?")),
             "value": (
                 f"accuracy {(m.get('accuracy') or 0) * 100:.1f}% · "
                 f"precision {(m.get('precision') or 0) * 100:.1f}% · "
                 f"recall {(m.get('recall') or 0) * 100:.1f}% · "
                 f"F1 {m.get('f1') or 0:.3f} · n={m.get('n_test')}"
             )}
            for m in job.get("models", [])
        ]
        return {
            **base,
            "sections": [
                {"title": "Job Overview", "rows": [
                    {"label": "Job ID", "value": job.get("job_id", "—")},
                    {"label": "Records Trained", "value": str(job.get("n_records") or "—")},
                    {"label": "Best Model", "value": (job.get("best_model") or {}).get("label", "—")},
                    {"label": "Deployed Model", "value": DEPLOYED_MODEL.get("label", "—")},
                ]},
                {"title": "Model Performance", "rows": rows},
            ],
        }

    total_users = db.query(func.count(User.id)).scalar() or 0
    total_predictions = db.query(func.count(Prediction.id)).scalar() or 0
    today_start = datetime.combine(date.today(), time.min)
    predictions_today = (
        db.query(func.count(Prediction.id)).filter(Prediction.created_at >= today_start).scalar() or 0
    )

    if report_type == "system_usage":
        counts = _role_counts(db)
        return {
            **base,
            "sections": [{"title": "System Usage", "rows": [
                {"label": "Total Users", "value": str(total_users)},
                {"label": "Patients", "value": str(counts["patient"])},
                {"label": "Providers", "value": str(counts["provider"])},
                {"label": "Admins", "value": str(counts["admin"])},
                {"label": "Predictions (All Time)", "value": str(total_predictions)},
                {"label": "Predictions Today", "value": str(predictions_today)},
            ]}],
        }

    if report_type == "user_analytics":
        counts = _role_counts(db)
        recent_users = db.query(User).order_by(User.created_at.desc()).limit(5).all()
        return {
            **base,
            "sections": [
                {"title": "User Analytics", "rows": [
                    {"label": "Total Users", "value": str(total_users)},
                    {"label": "Patients", "value": str(counts["patient"])},
                    {"label": "Providers", "value": str(counts["provider"])},
                    {"label": "Admins", "value": str(counts["admin"])},
                ]},
                {"title": "Recent Signups", "rows": [
                    {"label": u.full_name or u.email, "value": f"{u.role} · {(u.created_at.strftime('%Y-%m-%d') if u.created_at else '—')}"}
                    for u in recent_users
                ]},
            ],
        }

    counts = job_counts()
    job = get_latest_completed()
    model_rows = [
        {"label": m.get("label", m.get("id", "?")), "value": m.get("status", "—")}
        for m in (job or {}).get("models", [])
    ]
    return {
        **base,
        "sections": [
            {"title": "Training Summary", "rows": [
                {"label": "Total Jobs", "value": str(counts["total"])},
                {"label": "Running", "value": str(counts["running"])},
                {"label": "Completed", "value": str(counts["completed"])},
                {"label": "Failed", "value": str(counts["failed"])},
                {"label": "Latest Job", "value": (job or {}).get("job_id", "—")},
                {"label": "Latest Status", "value": (job or {}).get("status", "—")},
                {"label": "Records Trained", "value": str((job or {}).get("n_records") or "—")},
            ]},
        ] + ([{"title": "Models in Latest Job", "rows": model_rows}] if model_rows else []),
    }


def _build_report(report_type: str, user: User, db: Session, start: date | None, end: date | None) -> dict:
    if user.role == "patient":
        return _build_patient_report(report_type, user, db, start, end)
    if user.role == "provider":
        return _build_provider_report(report_type, user, db)
    return _build_admin_report(report_type, user, db)


def _build_recommendations(f: dict, probability: float) -> list[dict]:
    recs: list[dict] = []
    prob_text = f"{probability * 100:.0f}%"
    glucose = f.get("Glucose")
    bmi = f.get("BMI")
    bp = f.get("BloodPressure")
    age = f.get("Age")
    pedigree = f.get("DiabetesPedigree")
    level = _risk_level(probability)

    if probability >= 0.66:
        recs.append({
            "category": "Exercise", "priority": 1,
            "title": "Aerobic Exercise Program",
            "description": "150 minutes of moderate-intensity aerobic activity per week. Brisk walking, cycling, or swimming all qualify. Break it into 30-min daily sessions for easier adherence.",
            "impact": "↓ 18% risk",
            "reason": f"Your predicted risk is high ({prob_text}); regular aerobic exercise is the most effective single intervention.",
        })
    if glucose is not None and glucose >= 126:
        recs.append({
            "category": "Monitoring", "priority": 1,
            "title": "Schedule HbA1c Test",
            "description": "An HbA1c test gives a 3-month picture of average blood sugar. If above 5.7%, you are in the pre-diabetic range and immediate intervention is warranted.",
            "impact": "Diagnostic",
            "reason": f"Your fasting glucose was {glucose:.0f} mg/dL, at or above the diabetes diagnostic threshold (126 mg/dL).",
        })
    if bmi is not None and bmi >= 25:
        recs.append({
            "category": "Weight", "priority": 2,
            "title": "5–7% Body Weight Reduction",
            "description": "Losing just 5–7% of body weight (about 4–5 kg for you) can reduce diabetes risk by up to 58% in high-risk individuals, according to the DPP study.",
            "impact": "↓ 58% risk",
            "reason": f"Your BMI is {bmi:.1f}, above the healthy range (18.5–24.9).",
        })
    if bp is not None and bp >= 130:
        recs.append({
            "category": "Monitoring", "priority": 2,
            "title": "Blood Pressure Monitoring",
            "description": "Elevated blood pressure often coexists with insulin resistance. Monitor regularly and keep readings below 130/80 mmHg.",
            "impact": "↓ 14% risk",
            "reason": f"Your blood pressure was {bp:.0f} mmHg, above the recommended 130/80 target.",
        })
    if glucose is not None and (glucose > 100 or probability >= 0.33):
        recs.append({
            "category": "Diet", "priority": 3,
            "title": "Mediterranean Dietary Pattern",
            "description": "High in vegetables, whole grains, olive oil, and lean protein. Limit processed carbohydrates and added sugars. Aim for a glycemic index below 55 for main meals.",
            "impact": "↓ 22% risk",
            "reason": f"Your glucose ({glucose:.0f} mg/dL) or overall risk ({prob_text}) indicates a benefit from a lower-glycemic diet.",
        })
    if (age is not None and age >= 45) or (pedigree is not None and pedigree >= 0.5):
        recs.append({
            "category": "Monitoring", "priority": 3,
            "title": "Annual Diabetes Screening",
            "description": "National guidelines recommend annual fasting glucose or HbA1c screening for adults over 45 or those with a family history of type 2 diabetes.",
            "impact": "Early",
            "reason": f"Recommended based on your age ({age}) and/or family history (pedigree function {pedigree}).",
        })
    if probability >= 0.33:
        recs.append({
            "category": "Stress", "priority": 4,
            "title": "Stress Management",
            "description": "Chronic stress elevates cortisol, which raises blood glucose. Mindfulness-based stress reduction (MBSR) programs have shown significant HbA1c improvements.",
            "impact": "↓ 7% risk",
            "reason": "Moderate or higher predicted risk responds well to stress-reduction alongside lifestyle change.",
        })
    recs.append({
        "category": "Sleep", "priority": 5,
        "title": "Optimize Sleep Quality",
        "description": "Poor sleep is associated with insulin resistance. Target 7–9 hours per night. Establish a consistent bedtime and reduce blue-light exposure after 9 PM.",
        "impact": "↓ 9% risk",
        "reason": "Consistent 7–9 hours of sleep supports glucose regulation and lowers insulin resistance.",
    })
    if level in ("moderate", "high"):
        recs.append({
            "category": "Exercise", "priority": 2,
            "title": "Daily Walking Routine",
            "description": "A short 20-minute walk after each meal dampens post-meal glucose spikes. Aim for at least 7,000 steps per day.",
            "impact": "↓ 12% risk",
            "reason": f"Your current risk level is {level} ({prob_text}); post-meal walking is a low-effort, high-return habit.",
        })
    seen: set[tuple] = set()
    deduped = []
    for r in sorted(recs, key=lambda r: r["priority"]):
        key = (r["category"], r["title"])
        if key not in seen:
            seen.add(key)
            deduped.append(r)
    return deduped


class GenerateReportRequest(BaseModel):
    report_type: str
    start_date: str | None = None
    end_date: str | None = None


@app.get("/recommendations")
def get_recommendations(
    user: User = Depends(require_role("patient", "provider", "admin")),
    db: Session = Depends(get_db),
):
    latest = _latest_prediction_row(db, user.id)
    if not latest:
        return {
            "level": None,
            "probability": None,
            "predictions": 0,
            "latest_date": None,
            "recommendations": [],
        }

    pred, rec = latest
    features = {
        "Pregnancies": rec.pregnancies if rec.pregnancies is not None else 0,
        "Glucose": _field_value(rec.glucose, "Glucose"),
        "BloodPressure": _field_value(rec.blood_pressure, "BloodPressure"),
        "SkinThickness": _field_value(rec.skin_thickness, "SkinThickness"),
        "Insulin": _field_value(rec.insulin, "Insulin"),
        "BMI": _field_value(rec.bmi, "BMI"),
        "DiabetesPedigree": rec.diabetes_pedigree if rec.diabetes_pedigree is not None else 0,
        "Age": rec.age if rec.age is not None else 0,
    }
    total = (
        db.query(func.count(Prediction.id))
        .join(HealthRecord, Prediction.health_record_id == HealthRecord.id)
        .filter(HealthRecord.user_id == user.id)
        .scalar()
        or 0
    )
    return {
        "level": _risk_level(pred.risk_probability or 0),
        "probability": pred.risk_probability,
        "predictions": total,
        "latest_date": pred.created_at.isoformat() if pred.created_at else None,
        "recommendations": _build_recommendations(features, pred.risk_probability or 0),
    }


@app.get("/reports/recent")
def reports_recent(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(GeneratedReport)
        .filter(GeneratedReport.owner_id == user.id)
        .order_by(GeneratedReport.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": r.id,
            "report_type": r.report_type,
            "title": r.title,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@app.post("/reports/generate")
def reports_generate(
    payload: GenerateReportRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed = REPORT_TYPES.get(user.role, [])
    if payload.report_type not in allowed:
        raise HTTPException(
            status_code=422,
            detail=f"Report type '{payload.report_type}' is not available for role '{user.role}'",
        )
    summary = _build_report(
        payload.report_type,
        user,
        db,
        _parse_report_date(payload.start_date),
        _parse_report_date(payload.end_date),
    )
    report = GeneratedReport(
        owner_id=user.id,
        role=user.role,
        report_type=payload.report_type,
        title=summary["title"],
        payload_json=json.dumps(summary),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {
        "id": report.id,
        "report_type": report.report_type,
        "title": report.title,
        "created_at": report.created_at.isoformat() if report.created_at else None,
        "summary": summary,
    }


@app.get("/reports/{report_id}")
def reports_detail(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = _get_owned_report(report_id, user, db)
    return {
        "id": report.id,
        "report_type": report.report_type,
        "title": report.title,
        "created_at": report.created_at.isoformat() if report.created_at else None,
        "summary": json.loads(report.payload_json),
    }


@app.get("/reports/{report_id}/download")
def reports_download(
    report_id: int,
    format: str = Query("csv"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = _get_owned_report(report_id, user, db)
    summary = json.loads(report.payload_json)
    if format == "json":
        content = json.dumps(summary, indent=2)
        media_type = "application/json"
        ext = "json"
    else:
        content = _summary_to_csv(summary)
        media_type = "text/csv"
        ext = "csv"
    filename = "".join(ch for ch in summary["title"] if ch.isalnum() or ch in " _-").strip().replace(" ", "_")
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}.{ext}"'},
    )