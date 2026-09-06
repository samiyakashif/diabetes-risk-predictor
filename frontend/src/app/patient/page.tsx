"use client";

import Link from "next/link";
import {
  Activity,
  Calendar,
  ClipboardList,
  Heart,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { RiskGauge } from "@/components/ui/RiskGauge";
import { Button } from "@/components/ui/Button";
import { RiskFactorsChart } from "@/components/dashboard/RiskFactorsChart";
import { usePrediction } from "@/components/prediction/PredictionProvider";
import { usePredictionHistory } from "@/hooks/usePredictionHistory";
import { healthTrendData, quickRecommendations } from "@/lib/dashboard-data";
import type { PredictionRecord } from "@/types/prediction";
import {
  RISK_CONFIG,
  riskLevelFromProbability,
  riskScoreFromProbability,
} from "@/types/prediction";

const QUICK_REC_ICONS: Record<string, React.ElementType> = {
  activity: Activity,
  heart: Heart,
  clipboard: ClipboardList,
};

function toTrend(records: PredictionRecord[]) {
  return [...records]
    .reverse()
    .slice(-6)
    .map((r) => ({
      month: new Date(r.date).toLocaleDateString(undefined, { month: "short" }),
      glucose: r.glucose,
      risk: riskScoreFromProbability(r.risk_probability),
    }));
}

export default function PatientDashboard() {
  const { prediction } = usePrediction();
  const { records } = usePredictionHistory();

  const hasPrediction = Boolean(prediction);
  const historyTrend = toTrend(records);
  const trend = historyTrend.length >= 2 ? historyTrend : healthTrendData;
  const latest = records[0];
  const level = prediction
    ? riskLevelFromProbability(prediction.result.risk_probability)
    : latest
      ? riskLevelFromProbability(latest.risk_probability)
      : "low";
  const score = prediction
    ? riskScoreFromProbability(prediction.result.risk_probability)
    : latest
      ? riskScoreFromProbability(latest.risk_probability)
      : 44;
  const riskColor = RISK_CONFIG[level].color;
  const lastPredictionLabel =
    prediction?.createdAt ??
    latest?.date ??
    null;
  const totalCount = Math.max(records.length, prediction ? 1 : 0);

  return (
    <>
      <div className="mb-5 md:mb-8">
        <h1
          className="text-xl md:text-2xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Good morning, Alex 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s your health summary for {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
        <StatCard
          title="Latest Risk Level"
          value={RISK_CONFIG[level].label.replace(" Risk", "")}
          subtitle={`Score: ${score}/100`}
          icon={Activity}
          color={riskColor}
        />
        <StatCard
          title="Last Prediction"
          value={lastPredictionLabel ? new Date(lastPredictionLabel).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
          subtitle={hasPrediction ? "Latest assessment" : "No predictions yet"}
          icon={Calendar}
          color="#0D7A8A"
        />
        <StatCard
          title="Total Predictions"
          value={`${totalCount}`}
          subtitle="All-time assessments"
          icon={ClipboardList}
          color="#6264A0"
        />
        <StatCard
          title="Health Score"
          value={`${score}/100`}
          subtitle={hasPrediction ? "From latest assessment" : "Enter health data"}
          icon={Heart}
          color="#2A9E6B"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-xl border border-border p-6 flex flex-col items-center gap-4">
          <div className="w-full flex items-center justify-between">
            <h3
              className="font-semibold text-foreground text-sm"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Current Risk Score
            </h3>
            <Link href="/patient/prediction">
              <Button variant="secondary" size="sm">
                View Details
              </Button>
            </Link>
          </div>
          <RiskGauge score={score} level={level} />
          <p className="text-xs text-muted-foreground text-center">
            {hasPrediction
              ? "Based on your latest health data"
              : "Run a prediction to see your score"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border p-6">
          <h3
            className="font-semibold text-foreground text-sm mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Top Risk Factors
          </h3>
          <RiskFactorsChart height={200} withAxis={false} />
        </div>

        <div className="bg-white rounded-xl border border-border p-6 flex flex-col gap-3">
          <h3
            className="font-semibold text-foreground text-sm"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Quick Recommendations
          </h3>
          {quickRecommendations.map((r, i) => {
            const Icon = QUICK_REC_ICONS[r.iconName];
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${r.color}18` }}
                >
                  <Icon size={13} style={{ color: r.color }} />
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {r.text}
                </p>
              </div>
            );
          })}
          <Link href="/patient/recommendations">
            <Button variant="secondary" size="sm" className="w-full justify-center mt-2">
              All Recommendations
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-4 md:mt-6 bg-white rounded-xl border border-border p-4 md:p-6">
        <h3
          className="font-semibold text-foreground text-sm mb-5"
          style={{ fontFamily: "var(--font-display)" }}
        >
          6-Month Health Trend
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-primary inline-block rounded" />
              Glucose (mg/dL)
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECEAE6" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8D9EA0" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8D9EA0" }} axisLine={false} tickLine={false} domain={["dataMin - 5", "dataMax + 5"]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DDD9D4" }} />
                <Line
                  type="monotone"
                  dataKey="glucose"
                  stroke="#0D7A8A"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#0D7A8A", strokeWidth: 0 }}
                  name="Glucose"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-destructive inline-block rounded" />
              Risk Score (0–100)
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ECEAE6" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8D9EA0" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8D9EA0" }} axisLine={false} tickLine={false} domain={["dataMin - 5", "dataMax + 5"]} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DDD9D4" }} />
                <Line
                  type="monotone"
                  dataKey="risk"
                  stroke="#C0453A"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#C0453A", strokeWidth: 0 }}
                  strokeDasharray="5 3"
                  name="Risk Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}