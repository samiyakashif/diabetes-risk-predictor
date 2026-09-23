export interface ModelMetric {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  status: "best" | "trained";
}

export const modelMetrics: ModelMetric[] = [
  { model: "Neural Network", accuracy: 94.2, precision: 93.8, recall: 91.4, f1: 92.6, status: "best" },
  { model: "SVM", accuracy: 91.7, precision: 90.2, recall: 89.6, f1: 89.9, status: "trained" },
  { model: "Decision Tree", accuracy: 87.3, precision: 86.1, recall: 88.4, f1: 87.2, status: "trained" },
  { model: "Logistic Reg.", accuracy: 89.1, precision: 88.7, recall: 87.9, f1: 88.3, status: "trained" },
];