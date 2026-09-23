import type { RiskLevel } from "@/types/prediction";

export interface ProviderPatient {
  id: number;
  name: string;
  email: string;
  age: number | null;
  last_check: string | null;
  glucose: number | null;
  bmi: number | null;
  probability: number;
  risk: RiskLevel;
}

export interface ProviderOverview {
  total_patients: number;
  predictions_today: number;
  high_risk: number;
  moderate_risk: number;
  low_risk: number;
  avg_risk: number;
  patients: ProviderPatient[];
}

export interface RiskFactor {
  name: string;
  impact: number;
  fill: string;
  value: number;
}

export interface ModelScore {
  model: string;
  score: number;
}

export interface PatientHistoryPoint {
  date: string | null;
  risk_probability: number;
  prediction: 0 | 1;
}

export interface PatientDetail {
  id: number;
  name: string;
  email: string;
  age: number | null;
  last_check: string | null;
  prediction: 0 | 1;
  risk_probability: number;
  risk_label: "Diabetic" | "Not Diabetic";
  glucose: number | null;
  blood_pressure: number | null;
  skin_thickness: number | null;
  insulin: number | null;
  bmi: number | null;
  diabetes_pedigree: number | null;
  pregnancies: number | null;
  factors: RiskFactor[];
  history: PatientHistoryPoint[];
  model_scores: ModelScore[] | null;
}

export interface AdminOverview {
  total_users: number;
  total_predictions: number;
  jobs: {
    total: number;
    running: number;
    completed: number;
    failed: number;
  };
  deployed_model: {
    model_id: string;
    label: string;
    model_type: string;
  };
  latest_job_id: string | null;
}