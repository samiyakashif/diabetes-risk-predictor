export type RiskLevel = "low" | "moderate" | "high";

export interface PredictionResult {
  prediction: 0 | 1;
  risk_label: "Diabetic" | "Not Diabetic";
  risk_probability: number;
  health_record_id: number;
}

export interface PredictionRecord {
  prediction_id: number;
  date: string;
  prediction: 0 | 1;
  risk_probability: number;
  risk_label: "Diabetic" | "Not Diabetic";
  glucose: number;
  blood_pressure: number;
  skin_thickness: number;
  insulin: number;
  bmi: number;
  diabetes_pedigree: number;
  age: number;
  pregnancies: number;
}

export interface RiskConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  text: string;
  icon: string;
}

export const RISK_CONFIG: Record<RiskLevel, RiskConfig> = {
  low: {
    label: "Low Risk",
    color: "#2A9E6B",
    bg: "#EEF9F4",
    border: "#A8E2C8",
    text: "#1A6042",
    icon: "✓",
  },
  moderate: {
    label: "Moderate Risk",
    color: "#C8821A",
    bg: "#FDF6E8",
    border: "#F0CF8A",
    text: "#7A4D0A",
    icon: "▲",
  },
  high: {
    label: "High Risk",
    color: "#C0453A",
    bg: "#FBF0EF",
    border: "#F0B8B4",
    text: "#7A1F1A",
    icon: "!",
  },
};

export function riskLevelFromProbability(probability: number): RiskLevel {
  if (probability < 0.33) return "low";
  if (probability < 0.66) return "moderate";
  return "high";
}

export function riskScoreFromProbability(probability: number): number {
  return Math.round(probability * 100);
}