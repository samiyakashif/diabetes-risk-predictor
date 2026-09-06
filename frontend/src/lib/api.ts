import type {
  HealthFeatures,
} from "@/types/health";
import type {
  PredictionResult,
  PredictionRecord,
} from "@/types/prediction";
import type {
  Token,
  UserCreate,
  UserLogin,
} from "@/types/user";

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
};