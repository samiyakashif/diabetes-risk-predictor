import type {
  HealthFeatures,
} from "@/types/health";
import type {
  PredictionResult,
  PredictionRecord,
} from "@/types/prediction";
import type {
  Token,
  User,
  UserCreate,
  UserLogin,
} from "@/types/user";
import type {
  DeployResponse,
  TrainingJob,
} from "@/types/training";
import type {
  AdminOverview,
  PatientDetail,
  ProviderOverview,
} from "@/types/provider";
import type { RecommendationResponse } from "@/types/recommendations";
import type {
  GenerateReportResponse,
  GeneratedReportMeta,
  ReportFormat,
} from "@/types/reports";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const TOKEN_KEY = "diabeta_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = false
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (authenticated) {
    const token = getToken();
    if (!token) throw new ApiError("Not authenticated", 401);
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      message = body.detail ?? message;
    } catch {
      // fall back to generic message
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export const api = {
  register(user: UserCreate) {
    return request<{ message: string; user_id: number }>("/register", {
      method: "POST",
      body: JSON.stringify(user),
    });
  },

  login(credentials: UserLogin) {
    return request<Token>("/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  getMe() {
    return request<User>("/me", {}, true);
  },

  predict(features: HealthFeatures) {
    return request<PredictionResult>(
      "/predict",
      {
        method: "POST",
        body: JSON.stringify(features),
      },
      true
    );
  },

  getPredictions() {
    return request<PredictionRecord[]>("/predictions", {}, true);
  },

  changePassword(currentPassword: string, newPassword: string) {
    return request<{ message: string }>(
      "/change-password",
      {
        method: "PUT",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      },
      true
    );
  },

  trainModels(models: string[]) {
    return request<TrainingJob>(
      "/admin/train",
      {
        method: "POST",
        body: JSON.stringify({ models }),
      },
      true
    );
  },

  getTrainingStatus(jobId: string) {
    return request<TrainingJob>(`/admin/train/${jobId}`, {}, true);
  },

  getLatestTraining() {
    return request<TrainingJob>("/admin/models/latest", {}, true);
  },

  deployModel(jobId: string, model: string) {
    return request<DeployResponse>(
      "/admin/deploy",
      {
        method: "POST",
        body: JSON.stringify({ job_id: jobId, model }),
      },
      true
    );
  },

  getProviderOverview() {
    return request<ProviderOverview>("/provider/overview", {}, true);
  },

  getPatientDetail(patientId: number) {
    return request<PatientDetail>(`/provider/patients/${patientId}`, {}, true);
  },

  getAdminOverview() {
    return request<AdminOverview>("/admin/overview", {}, true);
  },

  getRecommendations() {
    return request<RecommendationResponse>("/recommendations", {}, true);
  },

  getRecentReports() {
    return request<GeneratedReportMeta[]>("/reports/recent", {}, true);
  },

  generateReport(
    reportType: string,
    startDate?: string,
    endDate?: string
  ) {
    return request<GenerateReportResponse>(
      "/reports/generate",
      {
        method: "POST",
        body: JSON.stringify({
          report_type: reportType,
          start_date: startDate,
          end_date: endDate,
        }),
      },
      true
    );
  },

  getReport(reportId: number) {
    return request<GenerateReportResponse>(`/reports/${reportId}`, {}, true);
  },

  async downloadReport(reportId: number, format: ReportFormat = "csv") {
    const token = getToken();
    if (!token) throw new ApiError("Not authenticated", 401);
    const response = await fetch(
      `${API_BASE_URL}/reports/${reportId}/download?format=${format}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      try {
        const body = await response.json();
        message = body.detail ?? message;
      } catch {
        // fall back to generic message
      }
      throw new ApiError(message, response.status);
    }
    return response.blob();
  },
};