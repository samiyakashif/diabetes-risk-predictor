export interface HealthFeatures {
  Pregnancies: number;
  Glucose: number;
  BloodPressure: number;
  SkinThickness: number;
  Insulin: number;
  BMI: number;
  DiabetesPedigree: number;
  Age: number;
}

export const HEALTH_FEATURE_LABELS: Record<keyof HealthFeatures, string> = {
  Pregnancies: "Pregnancies",
  Glucose: "Glucose (mg/dL)",
  BloodPressure: "Blood Pressure (mm Hg)",
  SkinThickness: "Skin Thickness (mm)",
  Insulin: "Insulin (mu U/mL)",
  BMI: "BMI",
  DiabetesPedigree: "Diabetes Pedigree Function",
  Age: "Age",
};

export const HEALTH_FEATURE_UNITS: Record<keyof HealthFeatures, string> = {
  Pregnancies: "count",
  Glucose: "mg/dL",
  BloodPressure: "mm Hg",
  SkinThickness: "mm",
  Insulin: "mu U/mL",
  BMI: "kg/m²",
  DiabetesPedigree: "log",
  Age: "years",
};

export const FEATURE_ORDER: (keyof HealthFeatures)[] = [
  "Pregnancies",
  "Glucose",
  "BloodPressure",
  "SkinThickness",
  "Insulin",
  "BMI",
  "DiabetesPedigree",
  "Age",
];

export interface HealthRecord {
  id: number;
  user_id: number;
  pregnancies: number;
  glucose: number;
  blood_pressure: number;
  skin_thickness: number;
  insulin: number;
  bmi: number;
  diabetes_pedigree: number;
  age: number;
  recorded_at?: string;
}