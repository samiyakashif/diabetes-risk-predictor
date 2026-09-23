"use client";

import {
  Activity,
  AlertCircle,
  BarChart3,
  Download,
  Search,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { StatCard } from "@/components/dashboard/StatCard";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { ProviderOverview } from "@/types/provider";
import type { RiskLevel } from "@/types/prediction";

const PAGE_SIZE = 5;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProviderDashboard() {
  const [overview, setOverview] = useState<ProviderOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProviderOverview();
      setOverview(data);
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
        const data = await api.getProviderOverview();
        if (!cancelled) setOverview(data);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load overview"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const patients = overview?.patients ?? [];
  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      String(p.id) === query.trim()
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const riskDist = [
    { name: "Low Risk", value: overview?.low_risk ?? 0, fill: "#2A9E6B" },
    { name: "Moderate Risk", value: overview?.moderate_risk ?? 0, fill: "#C8821A" },
    { name: "High Risk", value: overview?.high_risk ?? 0, fill: "#C0453A" },
  ].filter((d) => d.value > 0);

  const total = overview?.total_patients ?? 0;
  const maxGlucose = patients.length
    ? Math.max(...patients.map((p) => p.glucose ?? 0))
    : 0;
  const maxGlucosePatient = patients.find((p) => (p.glucose ?? 0) === maxGlucose);

  const insights: { text: string; level: RiskLevel; time: string }[] = [
    ...(overview && overview.high_risk > 0
      ? [
          {
            text: `${overview.high_risk} high-risk ${overview.high_risk === 1 ? "patient" : "patients"} flagged — review and schedule follow-ups`,
            level: "high" as RiskLevel,
            time: "Now",
          },
        ]
      : []),
    ...(overview
      ? [
          {
            text: `${overview.predictions_today} risk ${overview.predictions_today === 1 ? "prediction" : "predictions"} run today across ${total} ${total === 1 ? "patient" : "patients"}`,
            level: "moderate" as RiskLevel,
            time: "Today",
          },
        ]
      : []),
    ...(maxGlucosePatient
      ? [
          {
            text: `Highest glucose: ${maxGlucose} mg/dL (${maxGlucosePatient.name}) — above the diabetic threshold`,
            level: "high" as RiskLevel,
            time: "Today",
          },
        ]
      : []),
    ...(overview && overview.avg_risk > 0
      ? [
          {
            text: `Average predicted risk across panel: ${Math.round(overview.avg_risk * 100)}/100`,
            level: overview.avg_risk >= 0.66 ? ("high" as RiskLevel) : overview.avg_risk >= 0.33 ? ("moderate" as RiskLevel) : ("low" as RiskLevel),
            time: "Today",
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="mb-5 md:mb-8">
        <h1
          className="text-xl md:text-2xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Provider Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Internal Medicine ·{" "}
          {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {error && !loading && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
        <StatCard title="Total Patients" value={loading ? "…" : String(total)} subtitle="With recent predictions" icon={Users} color="#0D7A8A" trend={overview ? `${overview.predictions_today} predictions today` : undefined} />
        <StatCard title="High Risk Patients" value={loading ? "…" : String(overview?.high_risk ?? 0)} subtitle="Require follow-up" icon={AlertCircle} color="#C0453A" />
        <StatCard title="Moderate Risk" value={loading ? "…" : String(overview?.moderate_risk ?? 0)} subtitle="Require monitoring" icon={BarChart3} color="#C8821A" />
        <StatCard title="Predictions Today" value={loading ? "…" : String(overview?.predictions_today ?? 0)} subtitle="Across all patients" icon={Activity} color="#2A9E6B" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="bg-white rounded-xl border border-border p-6">
          <h3
            className="font-semibold text-foreground text-sm mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Patient Risk Distribution
          </h3>
          {loading ? (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
          ) : riskDist.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">No patients yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={riskDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {riskDist.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`${v} patients`]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #DDD9D4" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {riskDist.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                      {d.name}
                    </span>
                    <span className="font-semibold text-foreground font-mono">
                      {d.value}
                      <span className="text-muted-foreground"> · {total ? Math.round((d.value / total) * 100) : 0}%</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border border-border p-4 md:p-6 md:col-span-2">
          <h3
            className="font-semibold text-foreground text-sm mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Recent Clinical Insights
          </h3>
          {loading ? (
            <div className="h-[120px] flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
          ) : insights.length === 0 ? (
            <div className="h-[120px] flex items-center justify-center text-sm text-muted-foreground">
              No clinical insights yet — run predictions to populate this panel
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {insights.map((ins, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                  <RiskBadge level={ins.level} />
                  <p className="text-sm text-foreground flex-1">{ins.text}</p>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{ins.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-6 border-b border-border">
          <h3
            className="font-semibold text-foreground text-sm"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Patient List
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary w-56"
                placeholder="Search patients..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Button variant="outline" size="sm" icon={Download}>
              Export
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Patient ID", "Name", "Age", "Last Check", "Glucose", "BMI", "Risk Level", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-6 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No patients match your search
                  </td>
                </tr>
              ) : (
                visible.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{p.id}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{p.name}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{p.age ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(p.last_check)}</td>
                    <td className="px-6 py-4 text-sm font-mono text-foreground">{p.glucose ?? "—"}</td>
                    <td className="px-6 py-4 text-sm font-mono text-foreground">{p.bmi ?? "—"}</td>
                    <td className="px-6 py-4">
                      <RiskBadge level={p.risk} />
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/provider/clinical?patient=${p.id}`}>
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {filtered.length === 0
              ? "No patients"
              : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length} ${filtered.length === 1 ? "patient" : "patients"}`}
          </p>
          {totalPages > 1 && (
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, n) => n + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={
                    n === currentPage
                      ? "w-8 h-8 rounded-lg text-xs font-medium bg-primary text-white"
                      : "w-8 h-8 rounded-lg text-xs font-medium hover:bg-muted text-muted-foreground"
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}