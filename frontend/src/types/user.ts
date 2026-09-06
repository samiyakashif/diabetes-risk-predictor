export type Role = "patient" | "provider" | "admin" | null;

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  created_at?: string;
}