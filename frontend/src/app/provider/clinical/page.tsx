"use client";

import {
  AlertCircle,
  Brain,
  CheckCircle,
  ClipboardList,
  Download,
} from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { PatientDetail, ProviderOverview } from "@/types/provider";
import { RISK_CONFIG, riskLevelFromProbability, riskScoreFromProbability } from "@/types/prediction";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ClinicalInsights() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramPatient = Number(searchParams.get("patient"));
  const [overview, setOverview] = useState<ProviderOverview | null>(null);
  const [selected, setSelected] = useState<number | null>(
    Number.isFinite(paramPatient) && paramPatient > 0 ? paramPatient : null
  );
  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const data = await api.getProviderOverview();
        if (!cancelled) {
          setOverview(data);
          if (!data.patients.length) {
            setLoading(false);
            return;
          }
          setSelected((current) => {
            const hasParam =
              Number.isFinite(paramPatient) && paramPatient > 0;
            return hasParam
              ? current
              : data.patients.length
                ? data.patients[0].id
                : null;
          });
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load patients");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selected == null) return;
    const id: number = selected;
    let cancelled = false;
    async function run() {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.getPatientDetail(id);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load patient");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const changePatient = useCallback(
    (id: number) => {
      setSelected(id);
      router.replace(`/provider/clinical?patient=${id}`);
    },
    [router]
  );

  const riskLevel = detail
    ? riskLevelFromProbability(detail.risk_probability)
    : "low";
  const riskScore = detail ? riskScoreFromProbability(detail.risk_probability) : 0;
  const trendData =
    detail?.history.map((h) => ({
      date: h.date
        ? new Date(h.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : "—",
      risk: riskScoreFromProbability(h.risk_probability),
    })) ?? [];
  const modelScores = detail?.model_scores ?? [];
  const topFactors = [...(detail?.factors ?? [])].sort((a, b) => b.impact - a.impact);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <SectionHeader
          title="Clinical Insights"
          subtitle={
            detail
              ? `Detailed ML analysis for ${detail.name}`
              : "Detailed ML analysis per patient"
          }
        />
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Patient
          </label>
          <select
            className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            value={selected ?? ""}
            disabled={!overview?.patients.length}
            onChange={(e) => changePatient(Number(e.target.value))}
          >
            {overview?.patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · P-{p.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && !loading && detail === null && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-xl border border-border p-6">
            <h3
              className="font-semibold text-foreground text-sm mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Patient Information
            </h3>
            {loading && detail === null ? (
              <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">
                Loading…
              </div>
            ) : !detail ? (
              <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">
                Select a patient to view their risk analysis
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Name", detail.name],
                    ["Age", detail.age != null ? `${detail.age} years` : "—"],
                    ["Patient ID", `P-${detail.id}`],
                    ["Last Visit", formatDate(detail.last_check)],
                    ["BMI", detail.bmi != null ? String(detail.bmi) : "—"],
                    ["Email", detail.email],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-xs text-muted-foreground">{k}</p>
                      <p
                        className="font-semibold text-foreground mt-0.5 break-all"
                        style={{ fontFamily: k === "Patient ID" ? "var(--font-mono)" : undefined }}
                      >
                        {v}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Prediction Result</span>
                    <RiskBadge level={riskLevel} size="md" />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">Risk Score</span>
                    <span
                      className="text-xl font-bold font-mono"
                      style={{ color: RISK_CONFIG[riskLevel].color }}
                    >
                      {riskScore}/100
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <h3
              className="font-semibold text-foreground text-sm mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Risk Factor Analysis
            </h3>
            {loading && detail === null ? (
              <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
            ) : detail ? (
              <ResponsiveContainer width="100%" height={Math.min(40 + topFactors.length * 22, 260)}>
                <BarChart data={topFactors} layout="vertical" barSize={10}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={150}
                    tick={{ fontSize: 10, fill: "#68787A" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                    {topFactors.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <h3
              className="font-semibold text-foreground text-sm mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Historical Trend
            </h3>
            {loading && detail === null ? (
              <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
            ) : trendData.length ? (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={trendData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8D9EA0" }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 100]} />
                  <Line type="monotone" dataKey="risk" stroke="#C0453A" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              detail && (
                <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">
                  No history yet for this patient
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-primary" />
              <h3
                className="font-semibold text-foreground text-sm"
                style={{ fontFamily: "var(--font-display)" }}
              >
                ML Insight Summary
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 mb-4 flex gap-2">
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
              For clinical decision support only. This AI analysis is not a substitute for
              professional medical diagnosis.
            </div>
            {loading && detail === null ? (
              <div className="h-[120px] flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
            ) : detail ? (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The model assigns a{" "}
                  <strong className="text-foreground">{detail.risk_label}</strong> classification
                  with {riskScore}/100 score. {topFactors.length >= 2 && (
                    <>
                      Primary driver:{" "}
                      <strong className="text-foreground">{topFactors[0].name.toLowerCase()} of{" "}
                      {topFactors[0].value > 0 ? topFactors[0].value : "—"}</strong>, followed by{" "}
                      <strong className="text-foreground">{topFactors[1].name.toLowerCase()}</strong>.
                    </>
                  )}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {modelScores.length > 0
                    ? modelScores.map((m) => (
                        <div key={m.model} className="flex items-center justify-between p-2.5 rounded-lg bg-muted text-xs">
                          <span className="text-muted-foreground">{m.model}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground font-mono">{m.score}/100</span>
                            <CheckCircle size={11} className="text-[#C0453A]" />
                          </div>
                        </div>
                      ))
                    : (
                        <div className="col-span-2 flex items-center justify-between p-2.5 rounded-lg bg-muted text-xs">
                          <span className="text-muted-foreground">Deployed Model</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground font-mono">{riskScore}/100</span>
                            <CheckCircle size={11} className="text-[#C0453A]" />
                          </div>
                        </div>
                      )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Scores reflect the latest completed training run; deploy a model from the Admin
                  console to update production scoring.
                </p>
              </>
            ) : null}
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <h3
              className="font-semibold text-foreground text-sm mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Clinical Actions
            </h3>
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-lg border border-red-200 bg-red-50">
                <p className="text-xs font-semibold text-red-800 mb-1">
                  Recommended Next Steps
                </p>
                <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                  <li>Review latest prediction and schedule a follow-up visit</li>
                  <li>Order HbA1c if fasting glucose is above the diabetic threshold</li>
                  <li>Discuss lifestyle interventions informed by the factor analysis</li>
                </ul>
              </div>
              <div className="flex gap-3 mt-2">
                <Button variant="primary" icon={Download}>
                  Download Report
                </Button>
                <Button variant="secondary" icon={ClipboardList}>
                  Submit Feedback
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ClinicalPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground p-6">Loading…</div>}>
      <ClinicalInsights />
    </Suspense>
  );
}