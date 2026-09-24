"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Brain,
  Clock,
  Heart,
  HeartPulse,
  Loader2,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { api, ApiError } from "@/lib/api";
import type { RecommendationResponse } from "@/types/recommendations";

const CATEGORY_STYLE: Record<string, { color: string; icon: typeof Activity }> = {
  Exercise: { color: "#2A9E6B", icon: Activity },
  Diet: { color: "#0D7A8A", icon: Heart },
  Monitoring: { color: "#C8821A", icon: Stethoscope },
  Weight: { color: "#6264A0", icon: TrendingUp },
  Sleep: { color: "#6366B1", icon: Clock },
  Stress: { color: "#C0453A", icon: Brain },
};

const LEVEL_LABEL: Record<string, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function RecommendationsPage() {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      try {
        const result = await api.getRecommendations();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load recommendations");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <SectionHeader
        title="Personalized Recommendations"
        subtitle="Evidence-based actions tailored to your current risk profile and biomarkers."
      />

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-16 justify-center">
          <Loader2 size={18} className="animate-spin" />
          Loading your personalized recommendations...
        </div>
      )}

      {!loading && error && (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <HeartPulse size={28} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {!loading && !error && data && data.recommendations.length === 0 && (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <HeartPulse size={28} className="text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">
            No predictions yet
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Run a risk assessment first and we will tailor recommendations to your results.
          </p>
          <Link
            href="/patient/health-input"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Activity size={15} /> Take a Risk Assessment
          </Link>
        </div>
      )}

      {data && data.recommendations.length > 0 && (
        <>
          <div
            className="bg-white rounded-xl border border-border p-4 mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
          >
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground">Based on your latest check ·</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${
                  data.level === "high" ? "bg-[#C0453A]" : data.level === "moderate" ? "bg-[#C8821A]" : "bg-[#2A9E6B]"
                }`}
              >
                {LEVEL_LABEL[data.level ?? "low"]} risk
              </span>
            </span>
            {data.probability !== null && (
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {(data.probability * 100).toFixed(1)}%
                </span>{" "}
                predicted risk
              </span>
            )}
            {data.latest_date && (
              <span className="text-muted-foreground">
                Assessed {formatDate(data.latest_date)}
              </span>
            )}
            <span className="text-muted-foreground">
              {data.predictions} total check{data.predictions === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
            {data.recommendations.map((r) => {
              const style = CATEGORY_STYLE[r.category] ?? CATEGORY_STYLE.Exercise;
              const Icon = style.icon;
              return (
                <div
                  key={r.title}
                  className="bg-white rounded-xl border border-border p-5 flex gap-4 hover:border-[#A8D9E2] hover:shadow-sm transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${style.color}18` }}
                  >
                    <Icon size={18} style={{ color: style.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full text-white capitalize"
                        style={{ backgroundColor: style.color }}
                      >
                        {r.category}
                      </span>
                      <span className="text-xs font-bold" style={{ color: style.color }}>
                        {r.impact}
                      </span>
                    </div>
                    <h4
                      className="font-semibold text-foreground mt-2 mb-1"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {r.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {r.description}
                    </p>
                    {r.reason && (
                      <p className="text-xs text-foreground/80 bg-muted rounded-lg px-3 py-2 mt-3 leading-relaxed">
                        Why: {r.reason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}