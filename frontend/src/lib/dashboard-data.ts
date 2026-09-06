import type { RiskLevel } from "@/types/prediction";

export interface TrendPoint {
  month: string;
  glucose: number;
  bmi: number;
  risk: number;
}

export interface RiskFactor {
  name: string;
  impact: number;
  fill: string;
}

export interface TrackingRecord {
  date: string;
  glucose: number;
  bmi: number;
  bp: string;
  risk: RiskLevel;
  score: number;
}

// Placeholder data shown before real prediction history is available.
// Will be replaced by backend /predictions history in a later step.

export const healthTrendData: TrendPoint[] = [
  { month: "Dec", glucose: 118, bmi: 27.2, risk: 42 },
  { month: "Jan", glucose: 124, bmi: 27.8, risk: 51 },
  { month: "Feb", glucose: 131, bmi: 28.1, risk: 58 },
  { month: "Mar", glucose: 128, bmi: 27.9, risk: 55 },
  { month: "Apr", glucose: 122, bmi: 27.4, risk: 48 },
  { month: "May", glucose: 119, bmi: 27.1, risk: 44 },
];

export const riskFactorsData: RiskFactor[] = [
  { name: "Glucose Level", impact: 38, fill: "#C0453A" },
  { name: "BMI", impact: 24, fill: "#C8821A" },
  { name: "Age", impact: 17, fill: "#C8821A" },
  { name: "Blood Pressure", impact: 12, fill: "#E5AC30" },
  { name: "Insulin", impact: 9, fill: "#2A9E6B" },
];

export const trackingHistory: TrackingRecord[] = [
  { date: "May 20, 2026", glucose: 119, bmi: 27.1, bp: "122/78", risk: "low", score: 44 },
  { date: "Apr 15, 2026", glucose: 122, bmi: 27.4, bp: "125/80", risk: "low", score: 48 },
  { date: "Mar 12, 2026", glucose: 128, bmi: 27.9, bp: "128/82", risk: "moderate", score: 55 },
  { date: "Feb 08, 2026", glucose: 131, bmi: 28.1, bp: "131/84", risk: "moderate", score: 58 },
  { date: "Jan 14, 2026", glucose: 124, bmi: 27.8, bp: "127/81", risk: "moderate", score: 51 },
];

export const quickRecommendations = [
  {
    iconName: "activity",
    text: "30 min daily walk reduces glucose by ~8%",
    color: "#2A9E6B",
  },
  {
    iconName: "heart",
    text: "Mediterranean diet may lower your risk 18%",
    color: "#0D7A8A",
  },
  {
    iconName: "clipboard",
    text: "Schedule A1C test — due in 3 weeks",
    color: "#C8821A",
  },
];