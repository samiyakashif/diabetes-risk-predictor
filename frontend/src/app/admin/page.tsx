"use client";

import {
  BarChart2,
  Brain,
  Database,
  FileText,
  RefreshCw,
  Server,
  Star,
  Upload,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { modelMetrics as demoMetrics } from "@/lib/demo-data";
import type { AdminOverview } from "@/types/provider";
import type { TrainingJob } from "@/types/training";

const QUICK_ACTIONS = [
  { label: "Import Dataset", icon: Upload, color: "#0D7A8A", href: "/admin/training" },
  { label: "Train Models", icon: Brain, color: "#6264A0", href: "/admin/training" },
  { label: "Generate Report", icon: FileText, color: "#2A9E6B", href: "/admin/reports" },
  { label: "Evaluate Models", icon: BarChart2, color: "#C8821A", href: "/admin/evaluation" },
];

interface Metric {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  status: "best" | "deployed" | "trained";
}

function pct(value?: number): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.round((value > 1 ? value : value * 100) * 10) / 10;
}

function toMetrics(
  job: TrainingJob | null,
  deployedId: string | null
): Metric[] | null {
  if (!job || !job.models?.length) return null;
  const trained = job.models.filter((m) => m.accuracy != null);
  if (!trained.length) return null;
  return trained.map((m) => ({
    model: m.label,
    accuracy: pct(m.accuracy),
    precision: pct(m.precision),
    recall: pct(m.recall),
    f1: pct(m.f1),
    status:
      job.best_model?.id === m.id
        ? "best"
        : deployedId === m.id
          ? "deployed"
          : "trained",
  }));
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [job, setJob] = useState<TrainingJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminOverview();
      setOverview(data);
      if (data.latest_job_id) {
        try {
          const latest = await api.getLatestTraining();
          setJob(latest);
        } catch {
          setJob(null);
        }
      } else {
        setJob(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const data = await api.getAdminOverview();
        if (cancelled) return;
        setOverview(data);
        if (data.latest_job_id) {
          try {
            const latest = await api.getLatestTraining();
            if (!cancelled) setJob(latest);
          } catch {
            // keep null — metrics fall back to demo
          }
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load overview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = toMetrics(job, overview?.deployed_model.model_id ?? null);
  const displayMetrics = metrics ?? (loading ? null : demoMetrics);

  const jobs = overview?.jobs;
  const systemHealth = [
    {
      label: "Total Predictions",
      value: overview?.total_predictions ?? 0,
      pct: Math.min(overview?.total_predictions ?? 0, 40) / 40 * 100,
      unit: "",
      color: "#0D7A8A",
    },
    {
      label: "Completed Training Jobs",
      value: jobs?.completed ?? 0,
      pct: jobs && jobs.total > 0 ? (jobs.completed / jobs.total) * 100 : 0,
      unit: "",
      color: "#2A9E6B",
    },
    {
      label: "Running Jobs",
      value: jobs?.running ?? 0,
      pct: jobs && jobs.total > 0 ? (jobs.running / jobs.total) * 100 : 0,
      unit: "",
      color: "#C8821A",
    },
    {
      label: "Failed Jobs",
      value: jobs?.failed ?? 0,
      pct: jobs && jobs.total > 0 ? (jobs.failed / jobs.total) * 100 : 0,
      unit: "",
      color: "#C0453A",
    },
  ];

  return (
    <>
      <div className="mb-5 md:mb-8">
        <h1
          className="text-xl md:text-2xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Administrator Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {error ? (
            <span className="text-red-700">{error}</span>
          ) : overview ? (
            <>
              System overview · Deployed model: {overview.deployed_model.label} (
              {overview.deployed_model.model_type})
            </>
          ) : (
            "Loading system overview…"
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
        <StatCard
          title="Total Users"
          value={loading ? "…" : String(overview?.total_users ?? 0)}
          subtitle="Patients, providers & admins"
          icon={Users}
          color="#0D7A8A"
        />
        <StatCard
          title="Predictions Recorded"
          value={loading ? "…" : String(overview?.total_predictions ?? 0)}
          subtitle="All time, all users"
          icon={Database}
          color="#2A9E6B"
        />
        <StatCard
          title="Models Trained"
          value={loading ? "…" : job ? String(job.models.filter((m) => m.accuracy != null).length) : "—"}
          subtitle={job ? `From job ${job.job_id.slice(0, 8)}` : "No training run yet"}
          icon={Brain}
          color="#6264A0"
        />
        <StatCard
          title="Training Jobs"
          value={loading ? "…" : String(jobs?.total ?? 0)}
          subtitle={jobs ? `${jobs.completed} completed · ${jobs.failed} failed` : "—"}
          icon={Server}
          color="#0D7A8A"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="bg-white rounded-xl border border-border p-6">
          <h3
            className="font-semibold text-foreground text-sm mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            System Health
          </h3>
          <div className="flex flex-col gap-4">
            {systemHealth.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <span className="text-xs font-mono font-semibold text-foreground">
                    {loading ? "…" : s.value}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, s.pct)}%`, backgroundColor: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6">
          <h3
            className="font-semibold text-foreground text-sm mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-[#A8D9E2] hover:shadow-sm transition-all text-center"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${a.color}18` }}
                >
                  <a.icon size={18} style={{ color: a.color }} />
                </div>
                <span className="text-xs font-semibold text-foreground">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6">
          <h3
            className="font-semibold text-foreground text-sm mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Model Performance Overview
          </h3>
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">
                Loading…
              </div>
            ) : displayMetrics ? (
              displayMetrics.map((m) => (
                <div
                  key={m.model}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    m.status === "best" ? "bg-secondary border border-[#A8D9E2]" : "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {m.status === "best" && <Star size={12} className="text-primary" />}
                    <span className="text-xs font-semibold text-foreground">{m.model}</span>
                  </div>
                  <span
                    className="text-sm font-bold font-mono"
                    style={{ color: m.status === "best" ? "#0D7A8A" : "#3A4E50" }}
                  >
                    {m.accuracy}%
                  </span>
                </div>
              ))
            ) : (
              <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">
                No training run yet — Train Models to populate metrics
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3
            className="font-semibold text-foreground text-sm"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Deployed Model Metrics
          </h3>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={load}>
            Refresh
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Model", "Accuracy", "Precision", "Recall", "F1-Score", "Status"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : displayMetrics ? (
                displayMetrics.map((m, i) => (
                  <tr
                    key={i}
                    className={cn(
                      "border-b border-border last:border-0",
                      m.status === "best" && "bg-secondary/40"
                    )}
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      <span className="flex items-center gap-2">
                        {m.status === "best" && <Star size={13} className="text-primary" />}
                        {m.model}
                      </span>
                    </td>
                    {[m.accuracy, m.precision, m.recall, m.f1].map((v, j) => (
                      <td key={j} className="px-6 py-4 text-sm font-mono font-semibold" style={{ color: m.status === "best" ? "#0D7A8A" : "#3A4E50" }}>
                        {v}%
                      </td>
                    ))}
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full",
                          m.status === "best"
                            ? "bg-secondary text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {m.status === "best"
                          ? "✓ Best"
                          : m.status === "deployed"
                            ? "Deployed"
                            : "Trained"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No completed training run yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}