from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from database import SessionLocal
from models import User
from schemas import UserCreate, UserLogin, Token
from auth import hash_password, verify_password, create_access_token
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import json

app = FastAPI()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


model = joblib.load('../ml/models/diabetes_model.pkl')
scaler = joblib.load('../ml/models/scaler.pkl')

with open('../ml/models/medians.json') as f:
    medians = json.load(f)

# ... rest of your existing code (PatientData, endpoints) stays unchanged below this
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Diabetes Risk Predictor API is running"}

## update 2-----------------------
from fastapi import FastAPI
import joblib
import numpy as np

app = FastAPI()

# Load the model and scaler once, when the server starts
model = joblib.load('../ml/models/diabetes_model.pkl')
scaler = joblib.load('../ml/models/scaler.pkl')

@app.get("/")
def read_root():
    return {"message": "Diabetes Risk Predictor API is running"}

@app.get("/model-check")
def model_check():
    return {"model_loaded": True, "model_type": str(type(model).__name__)}

# updatre 3-------------------------
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()

model = joblib.load('../ml/models/diabetes_model.pkl')
scaler = joblib.load('../ml/models/scaler.pkl')



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

@app.post("/predict")
def predict(patient: PatientData):
    input_data = np.array([[
        patient.Pregnancies,
        patient.Glucose,
        patient.BloodPressure,
        patient.SkinThickness,
        patient.Insulin,
        patient.BMI,
        patient.DiabetesPedigree,
        patient.Age
    ]])

    input_scaled = scaler.transform(input_data)

    prediction = model.predict(input_scaled)[0]
    probability = model.predict_proba(input_scaled)[0][1]

    print(prediction)
    print(probability)

    return {
        "prediction": int(prediction),
        "risk_label": "Diabetic" if prediction == 1 else "Not Diabetic",
        "risk_probability": round(float(probability), 4)
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