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


@app.get("/")
def read_root():
    return {"message": "Diabetes Risk Predictor API is running"}


@app.get("/model-check")
def model_check():
    return {"model_loaded": True, "model_type": str(type(model).__name__)}


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