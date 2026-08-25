from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import json

app = FastAPI()

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