"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/api";
import type { User } from "@/types/user";

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (!getToken()) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        const me = await api.getMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          clearToken();
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async (accessToken: string): Promise<User | null> => {
    setToken(accessToken);
    window.dispatchEvent(new Event("storage"));
    try {
      const me = await api.getMe();
      setUser(me);
      setLoading(false);
      return me;
    } catch {
      clearToken();
      setUser(null);
      setLoading(false);
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("diabeta_role");
    clearToken();
    setUser(null);
    window.dispatchEvent(new Event("storage"));
  }, []);

  return {
    isAuthenticated: Boolean(token),
    user,
    role: user?.role ?? null,
    loading,
    login,
    logout,
  };
}