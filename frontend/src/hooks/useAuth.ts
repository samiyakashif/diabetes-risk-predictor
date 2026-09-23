"use client";

import { useCallback, useSyncExternalStore } from "react";
import { clearToken, getToken, setToken } from "@/lib/api";
import type { Role } from "@/types/user";

const ROLE_KEY = "diabeta_role";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getAuthSnapshot() {
  return getToken();
}

function getServerSnapshot(): string | null {
  return null;
}

export function useAuth() {
  const token = useSyncExternalStore(subscribe, getAuthSnapshot, getServerSnapshot);

  const login = useCallback((accessToken: string, role: Role) => {
    setToken(accessToken);
    if (role) localStorage.setItem(ROLE_KEY, role);
    window.dispatchEvent(new Event("storage"));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(ROLE_KEY);
    window.dispatchEvent(new Event("storage"));
  }, []);

  const getRole = useCallback((): Role => {
    if (typeof window === "undefined") return null;
    return (localStorage.getItem(ROLE_KEY) as Role) ?? null;
  }, []);

  return {
    isAuthenticated: Boolean(token),
    token,
    login,
    logout,
    getRole,
  };
}