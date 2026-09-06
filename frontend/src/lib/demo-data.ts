import type { RiskLevel } from "@/types/prediction";

export interface DemoPatient {
  id: string;
  name: string;
  age: number;
  lastCheck: string;
  glucose: number;
  bmi: number;
  risk: RiskLevel;
}

export interface ModelMetric {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  status: "best" | "trained";
}

export const providerPatients: DemoPatient[] = [
  { id: "P-1042", name: "Maria Santos", age: 54, lastCheck: "2026-05-20", glucose: 148, bmi: 31.2, risk: "high" },
  { id: "P-1038", name: "James Kowalski", age: 47, lastCheck: "2026-05-19", glucose: 132, bmi: 28.4, risk: "moderate" },
  { id: "P-1031", name: "Fatima Al-Rashid", age: 62, lastCheck: "2026-05-18", glucose: 158, bmi: 33.1, risk: "high" },
  { id: "P-1027", name: "David Chen", age: 38, lastCheck: "2026-05-17", glucose: 108, bmi: 24.6, risk: "low" },
  { id: "P-1019", name: "Aisha Okonkwo", age: 51, lastCheck: "2026-05-15", glucose: 127, bmi: 27.8, risk: "moderate" },
];

export const riskDistData = [
  { name: "Low Risk", value: 38, fill: "#2A9E6B" },
  { name: "Moderate Risk", value: 41, fill: "#C8821A" },
  { name: "High Risk", value: 21, fill: "#C0453A" },
];

export const modelMetrics: ModelMetric[] = [
  { model: "Neural Network", accuracy: 94.2, precision: 93.8, recall: 91.4, f1: 92.6, status: "best" },
  { model: "SVM", accuracy: 91.7, precision: 90.2, recall: 89.6, f1: 89.9, status: "trained" },
  { model: "Decision Tree", accuracy: 87.3, precision: 86.1, recall: 88.4, f1: 87.2, status: "trained" },
  { model: "Logistic Reg.", accuracy: 89.1, precision: 88.7, recall: 87.9, f1: 88.3, status: "trained" },
];