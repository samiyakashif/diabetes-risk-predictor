"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, DownloadCloud, Star, XCircle } from "lucide-react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { modelMetrics } from "@/lib/demo-data";
import type { TrainingJob } from "@/types/training";

interface MetricRow {
  id: string;
  label: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

const DEMO_CONFUSION = [
  { label: "TP", value: 142, color: "#2A9E6B" },
  { label: "FP", value: 12, color: "#EDAEAA" },
  { label: "FN", value: 18, color: "#EDAEAA" },
  { label: "TN", value: 212, color: "#A8E2C8" },
];

const PALETTE = ["#0D7A8A", "#2A9E6B", "#C8821A", "#6264A0"];

const pctOf = (v?: number) => {
  if (v === undefined) return 0;
  return v > 0 && v <= 1 ? v * 100 : v;
};

function EvalView() {
  const params = useSearchParams();
  const jobParam = params.get("job");

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<TrainingJob | null>(null);
  const [error, setError] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [deployMsg, setDeployMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fetched = jobParam
          ? await api.getTrainingStatus(jobParam)
          : await api.getLatestTraining();
        if (!cancelled) {
          if (fetched.status === "complete") {
            setJob(fetched);
          } else {
            setError("That training job is not complete yet.");
          }
        }
      } catch (err) {
        if (!cancelled && err instanceof ApiError && err.status === 404) {
          setError("No completed training jobs yet. Run a training first.");
        } else if (!cancelled) {
          setError("Could not load training results.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobParam]);

  const rows: MetricRow[] = job
    ? job.models
        .filter((m) => m.status === "completed" && m.accuracy !== undefined)
        .map((m) => ({
          id: m.id,
          label: m.label,
          accuracy: pctOf(m.accuracy),
          precision: pctOf(m.precision),
          recall: pctOf(m.recall),
          f1: pctOf(m.f1),
        }))
    : modelMetrics.map((m, i) => ({
        id: `demo${i}`,
        label: m.model,
        accuracy: m.accuracy,
        precision: m.precision,
        recall: m.recall,
        f1: m.f1,
      }));

  const best = rows.reduce<MetricRow | null>((acc, r) => {
    if (!acc) return r;
    if (r.f1 !== acc.f1) return r.f1 > acc.f1 ? r : acc;
    return r.accuracy > acc.accuracy ? r : acc;
  }, null);

  const liveBest = job?.best_model ? rows.find((r) => r.id === job.best_model!.id) : null;
  const bestRow = liveBest ?? best;

  const confMatrix = job && bestRow && (() => {
    const found = job.models.find((m) => m.id === bestRow.id);
    if (found?.confusion) {
      const c = found.confusion;
      return [
        { label: "TP", value: c.tp, color: "#2A9E6B" },
        { label: "FP", value: c.fp, color: "#EDAEAA" },
        { label: "FN", value: c.fn, color: "#EDAEAA" },
        { label: "TN", value: c.tn, color: "#A8E2C8" },
      ];
    }
    return null;
  })();

  const confusion = confMatrix ?? DEMO_CONFUSION;

  const radarData = ["Accuracy", "Precision", "Recall", "F1"].map((metric) => {
    const point: Record<string, string | number> = { metric };
    rows.forEach((r) => {
      const value = metric === "Accuracy" ? r.accuracy : metric === "Precision" ? r.precision : metric === "Recall" ? r.recall : r.f1;
      point[r.id] = value;
    });
    return point;
  });

  const onDeploy = async () => {
    if (!job || !bestRow) return;
    setDeploying(true);
    setDeployMsg("");
    try {
      const res = await api.deployModel(job.job_id, bestRow.id);
      setDeployMsg(res.message);
    } catch (err) {
      setDeployMsg(err instanceof ApiError ? err.message : "Deploy failed. Please try again.");
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground py-10">Loading evaluation results...</p>;
  }

  return (
    <>
      <SectionHeader
        title="Model Evaluation"
        subtitle={
          job
            ? `Results from job ${job.job_id} · ${job.n_records ?? "768"} records · hold-out test set`
            : "Reference performance metrics (no completed training job found)"
        }
      />

      {error && !job && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
            <XCircle size={16} />
            {error}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border mb-6">
        <div className="p-6 border-b border-border">
          <h3
            className="font-semibold text-foreground text-sm"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Performance Comparison
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Model", "Accuracy", "Precision", "Recall", "F1-Score"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isBest = bestRow?.id === r.id;
                return (
                  <tr
                    key={r.id}
                    className={cn("border-b border-border last:border-0", isBest && "bg-secondary/50")}
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      <span className="flex items-center gap-1.5">
                        {isBest && <Star size={13} className="text-primary" />}
                        {r.label}
                      </span>
                    </td>
                    {[r.accuracy, r.precision, r.recall, r.f1].map((v, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-mono font-semibold"
                            style={{ color: isBest ? "#0D7A8A" : "#3A4E50" }}
                          >
                            {v.toFixed(1)}%
                          </span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full max-w-16">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(v, 100)}%`,
                                backgroundColor: isBest ? "#0D7A8A" : "#8D9EA0",
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="bg-white rounded-xl border border-border p-6">
          <h3
            className="font-semibold text-foreground text-sm mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Confusion Matrix — {bestRow?.label}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {job ? `Test set: ${confusion.reduce((s, c) => s + c.value, 0)} samples` : "Reference demo values"}
          </p>
          <div className="grid grid-cols-2 gap-2 max-w-36 sm:max-w-48 mx-auto">
            {confusion.map((c) => (
              <div key={c.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: `${c.color}22` }}>
                <p className="text-2xl font-bold font-mono" style={{ color: c.color }}>
                  {c.value}
                </p>
                <p className="text-xs font-semibold mt-1" style={{ color: c.color }}>
                  {c.label}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-1 text-center text-xs text-muted-foreground">
            <span>Predicted Positive</span>
            <span>Predicted Negative</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6">
          <h3
            className="font-semibold text-foreground text-sm mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Multi-Metric Radar Comparison
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              {rows.map((r, i) => (
                <Radar
                  key={r.id}
                  dataKey={r.id}
                  stroke={PALETTE[i % PALETTE.length]}
                  fill={PALETTE[i % PALETTE.length]}
                  fillOpacity={0.12}
                  name={r.label}
                />
              ))}
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-secondary rounded-xl border border-[#A8D9E2] p-6 flex flex-wrap items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <Star size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h3 className="font-bold text-[#0A5F6C]" style={{ fontFamily: "var(--font-display)" }}>
            Recommended: {bestRow?.label ?? "—"}
          </h3>
          <p className="text-sm text-[#2A93A8] mt-0.5">
            {job
              ? `Highest F1 (${bestRow?.f1.toFixed(1)}%) in this training run. Deploy it to production.`
              : "Train models first to get live metrics and a deployable artifact."}
          </p>
        </div>
        {job && bestRow && (
          <Button variant="primary" icon={DownloadCloud} onClick={onDeploy} disabled={deploying}>
            {deploying ? "Deploying..." : `Deploy ${bestRow.label}`}
          </Button>
        )}
      </div>

      {deployMsg && (
        <div className="mt-4 p-4 rounded-xl bg-[#EEF9F4] border border-green-200">
          <div className="flex items-center gap-2 text-[#1A6042] font-semibold text-sm">
            <CheckCircle size={16} />
            {deployMsg}
          </div>
        </div>
      )}
    </>
  );
}

export default function ModelEvaluationPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground py-10">Loading evaluation...</p>}>
      <EvalView />
    </Suspense>
  );
}