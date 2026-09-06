"use client";

import {
  Activity,
  AlertCircle,
  ClipboardList,
  Download,
  Search,
  Users,
} from "lucide-react";
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
import { providerPatients, riskDistData } from "@/lib/demo-data";
import type { RiskLevel } from "@/types/prediction";

const INSIGHTS: { text: string; level: RiskLevel; time: string }[] = [
  { text: "Glucose levels rising in 5 patients over 45 this month", level: "high", time: "2h ago" },
  { text: "3 patients' risk dropped >10% following intervention notes", level: "low", time: "Yesterday" },
  { text: "BMI trend: 8 patients with increasing BMI over 3 months", level: "moderate", time: "2 days ago" },
];

export default function ProviderDashboard() {
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
          Dr. Sarah Chen — Internal Medicine ·{" "}
          {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
        <StatCard title="Total Patients" value="124" subtitle="Active panel" icon={Users} color="#0D7A8A" trend="6 new this month" />
        <StatCard title="High Risk Patients" value="26" subtitle="Require follow-up" icon={AlertCircle} color="#C0453A" />
        <StatCard title="Predictions Today" value="18" subtitle="Across all patients" icon={Activity} color="#2A9E6B" />
        <StatCard title="Pending Feedback" value="7" subtitle="Awaiting clinical notes" icon={ClipboardList} color="#C8821A" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="bg-white rounded-xl border border-border p-6">
          <h3
            className="font-semibold text-foreground text-sm mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Patient Risk Distribution
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={riskDistData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
                paddingAngle={3}
              >
                {riskDistData.map((d) => (
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
            {riskDistData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                  {d.name}
                </span>
                <span className="font-semibold text-foreground font-mono">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4 md:p-6 md:col-span-2">
          <h3
            className="font-semibold text-foreground text-sm mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Recent Clinical Insights
          </h3>
          <div className="flex flex-col gap-3">
            {INSIGHTS.map((ins, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <RiskBadge level={ins.level} />
                <p className="text-sm text-foreground flex-1">{ins.text}</p>
                <span className="text-xs text-muted-foreground flex-shrink-0">{ins.time}</span>
              </div>
            ))}
          </div>
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
              {providerPatients.map((p, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{p.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-foreground">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{p.age}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{p.lastCheck}</td>
                  <td className="px-6 py-4 text-sm font-mono text-foreground">{p.glucose}</td>
                  <td className="px-6 py-4 text-sm font-mono text-foreground">{p.bmi}</td>
                  <td className="px-6 py-4">
                    <RiskBadge level={p.risk} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm">
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        Notes
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Showing 5 of 124 patients</p>
          <div className="flex gap-1">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                className={
                  n === 1
                    ? "w-8 h-8 rounded-lg text-xs font-medium bg-primary text-white"
                    : "w-8 h-8 rounded-lg text-xs font-medium hover:bg-muted text-muted-foreground"
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}