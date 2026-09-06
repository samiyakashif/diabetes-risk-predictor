"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, clearToken } from "@/lib/api";
import type { PredictionRecord } from "@/types/prediction";

export function usePredictionHistory() {
  const router = useRouter();
  const [records, setRecords] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getPredictions();
      setRecords(data);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.push("/login");
        return;
      }
      if (err instanceof ApiError) setError(err.message);
      else setError("Could not load prediction history");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getPredictions();
        if (cancelled) return;
        setRecords(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          router.push("/login");
          return;
        }
        if (err instanceof ApiError) setError(err.message);
        else setError("Could not load prediction history");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return { records, loading, error, refresh };
}