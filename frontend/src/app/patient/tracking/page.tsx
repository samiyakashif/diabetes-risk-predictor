"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, RefreshCw } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { usePredictionHistory } from "@/hooks/usePredictionHistory";
import {
  RISK_CONFIG,
  riskLevelFromProbability,
  riskScoreFromProbability,
} from "@/types/prediction";
import type { PredictionRecord } from "@/types/prediction";

const RANGES = ["1m", "3m", "6m", "1y"] as const;
const RANGE_DAYS: Record<(typeof RANGES)[number], number> = {
  "1m": 31,
  "3m": 92,
  "6m": 183,
  "1y": 366,
};

function toTrendPoint(records: PredictionRecord[]) {
  return [...records]
    .reverse()
    .map((r) => ({
      month: new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      risk: riskScoreFromProbability(r.risk_probability),
    }));
}

function toTimeline(records: PredictionRecord[]) {
  return [...records].reverse().map((r) => ({
    ...r,
    level: riskLevelFromProbability(r.risk_probability),
    score: riskScoreFromProbability(r.risk_probability),
    dateLabel: new Date(r.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  }));
}

export default function TrackingPage() {
  const [dateRange, setDateRange] = useState<(typeof RANGES)[number]>("6m");
  const [now] = useState(() => Date.now());
  const { records, loading, error, refresh } = usePredictionHistory();

  const cutoff = now - RANGE_DAYS[dateRange] * 24 * 60 * 60 * 1000;
  const filtered = records.filter(
    (r) => new Date(r.date).getTime() >= cutoff
  );
  const trend = toTrendPoint(filtered);
  const timeline = toTimeline(filtered);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 md:mb-8">
        <SectionHeader
          title="Health Tracking"
          subtitle="Monitor your risk trend and historical health records."
        />
        <div className="flex gap-1.5 bg-muted rounded-lg p-1 self-start">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                dateRange === r
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
          Loading your history...
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button variant="secondary" icon={RefreshCw} onClick={refresh}>
            Retry
          </Button>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <p className="text-muted-foreground mb-4">
            No predictions yet. Run your first assessment to start tracking.
          </p>
          <Link href="/patient/health-input">
            <Button variant="primary" icon={Activity}>
              Enter Health Data
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-border p-6 mb-6">
            <h3
              className="font-semibold text-foreground text-sm mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Risk Level Trend
            </h3>
            {trend.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">
                No predictions in this date range.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ECEAE6" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#8D9EA0" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#8D9EA0" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DDD9D4" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="risk"
                    stroke="#0D7A8A"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: "#0D7A8A", strokeWidth: 2, stroke: "#fff" }}
                    name="Risk Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <h3
              className="font-semibold text-foreground text-sm mb-5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Health Record Timeline
            </h3>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No records in this date range.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="flex flex-col gap-4">
                  {timeline.map((r) => {
                    const config = RISK_CONFIG[r.level];
                    return (
                      <div key={r.prediction_id} className="flex gap-5 relative">
                        <div
                          className="w-8 h-8 rounded-full border-2 bg-white flex items-center justify-center flex-shrink-0 z-10"
                          style={{ borderColor: config.color }}
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: config.color }}
                          />
                        </div>
                        <div className="flex-1 bg-muted rounded-xl p-4 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p
                              className="text-sm font-semibold text-foreground"
                              style={{ fontFamily: "var(--font-mono)" }}
                            >
                              {r.dateLabel}
                            </p>
                            <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                              <span>
                                Glucose:{" "}
                                <strong className="text-foreground">
                                  {r.glucose} mg/dL
                                </strong>
                              </span>
                              <span>
                                BMI:{" "}
                                <strong className="text-foreground">{r.bmi}</strong>
                              </span>
                              <span>
                                BP:{" "}
                                <strong className="text-foreground">
                                  {r.blood_pressure} mm Hg
                                </strong>
                              </span>
                              <span>
                                Age:{" "}
                                <strong className="text-foreground">{r.age}</strong>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className="text-sm font-bold"
                              style={{ fontFamily: "var(--font-mono)", color: config.color }}
                            >
                              {r.score}/100
                            </span>
                            <RiskBadge level={r.level} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}