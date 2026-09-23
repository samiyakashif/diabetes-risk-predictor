export type Role = "patient" | "provider" | "admin";

export const ROLE_HOME: Record<Role, string> = {
  patient: "/patient",
  provider: "/provider",
  admin: "/admin",
};

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  role?: Role;
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
  role: Role;
  created_at?: string;
}