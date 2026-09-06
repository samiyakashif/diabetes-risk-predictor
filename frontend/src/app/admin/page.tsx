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
import { StatCard } from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { modelMetrics } from "@/lib/demo-data";

const SYSTEM_HEALTH = [
  { label: "CPU Usage", value: 34, color: "#2A9E6B" },
  { label: "Memory", value: 61, color: "#C8821A" },
  { label: "Avg Response", value: 28, unit: "ms", color: "#0D7A8A" },
  { label: "Disk Usage", value: 47, color: "#6264A0" },
];

const QUICK_ACTIONS = [
  { label: "Import Dataset", icon: Upload, color: "#0D7A8A" },
  { label: "Train Models", icon: Brain, color: "#6264A0" },
  { label: "Generate Report", icon: FileText, color: "#2A9E6B" },
  { label: "Evaluate Models", icon: BarChart2, color: "#C8821A" },
];

export default function AdminDashboard() {
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
          System overview · All systems operational
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
        <StatCard title="Total Users" value="1,247" subtitle="Patients, providers & admins" icon={Users} color="#0D7A8A" trend="48 new this month" />
        <StatCard title="Active Models" value="4" subtitle="All models deployed" icon={Brain} color="#6264A0" />
        <StatCard title="Datasets Loaded" value="3" subtitle="Pima + 2 clinical sets" icon={Database} color="#2A9E6B" />
        <StatCard title="System Uptime" value="99.97%" subtitle="Last 30 days" icon={Server} color="#2A9E6B" />
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
            {SYSTEM_HEALTH.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <span className="text-xs font-mono font-semibold text-foreground">
                    {s.value}
                    {s.unit || "%"}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${s.value}%`, backgroundColor: s.color }}
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
              <button
                key={a.label}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-[#A8D9E2] hover:shadow-sm transition-all text-center"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${a.color}18` }}
                >
                  <a.icon size={18} style={{ color: a.color }} />
                </div>
                <span className="text-xs font-semibold text-foreground">{a.label}</span>
              </button>
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
            {modelMetrics.map((m) => (
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
            ))}
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
          <Button variant="outline" size="sm" icon={RefreshCw}>
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
              {modelMetrics.map((m, i) => (
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
                      {m.status === "best" ? "✓ Best" : "Deployed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}