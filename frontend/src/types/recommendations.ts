export interface Recommendation {
  category: string;
  title: string;
  description: string;
  impact: string;
  priority: number;
  reason: string;
}

export interface RecommendationResponse {
  level: "low" | "moderate" | "high" | null;
  probability: number | null;
  predictions: number;
  latest_date: string | null;
  recommendations: Recommendation[];
}