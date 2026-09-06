"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { HealthFeatures } from "@/types/health";
import type { PredictionResult } from "@/types/prediction";

const STORAGE_KEY = "diabeta_last_prediction";

export interface StoredPrediction {
  result: PredictionResult;
  features: HealthFeatures;
  createdAt: string;
}

interface PredictionContextValue {
  prediction: StoredPrediction | null;
  setPrediction: (result: PredictionResult, features: HealthFeatures) => void;
  clearPrediction: () => void;
}

const PredictionContext = createContext<PredictionContextValue | null>(null);

function loadFromStorage(): StoredPrediction | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredPrediction) : null;
  } catch {
    return null;
  }
}

export function PredictionProvider({ children }: { children: React.ReactNode }) {
  const [prediction, setPredictionState] = useState<StoredPrediction | null>(
    () => loadFromStorage()
  );

  useEffect(() => {
    if (prediction) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prediction));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [prediction]);

  const value = useMemo<PredictionContextValue>(
    () => ({
      prediction,
      setPrediction: (result: PredictionResult, features: HealthFeatures) =>
        setPredictionState({
          result,
          features,
          createdAt: new Date().toISOString(),
        }),
      clearPrediction: () => setPredictionState(null),
    }),
    [prediction]
  );

  return (
    <PredictionContext.Provider value={value}>
      {children}
    </PredictionContext.Provider>
  );
}

export function usePrediction(): PredictionContextValue {
  const ctx = useContext(PredictionContext);
  if (!ctx) {
    throw new Error("usePrediction must be used within a PredictionProvider");
  }
  return ctx;
}