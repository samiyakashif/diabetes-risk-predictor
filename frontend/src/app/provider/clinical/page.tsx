"use client";

import {
  AlertCircle,
  Brain,
  CheckCircle,
  ClipboardList,
  Download,
} from "lucide-react";
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
import { riskFactorsData, healthTrendData } from "@/lib/dashboard-data";

const MODELS = [
  { model: "Neural Net", score: 79 },
  { model: "SVM", score: 76 },
  { model: "Decision Tree", score: 81 },
  { model: "Logistic Reg.", score: 74 },
];

export default function ClinicalInsightsPage() {
  return (
    <>
      <SectionHeader
        title="Clinical Insights"
        subtitle="Detailed ML analysis for patient P-1031 · Fatima Al-Rashid"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-xl border border-border p-6">
            <h3
              className="font-semibold text-foreground text-sm mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Name", "Fatima Al-Rashid"],
                ["Age", "62 years"],
                ["Gender", "Female"],
                ["Patient ID", "P-1031"],
                ["Last Visit", "May 18, 2026"],
                ["Primary Care", "Dr. Chen"],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p
                    className="font-semibold text-foreground mt-0.5"
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
                <RiskBadge level="high" size="md" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">Risk Score</span>
                <span className="text-xl font-bold text-[#C0453A] font-mono">78/100</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <h3
              className="font-semibold text-foreground text-sm mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Risk Factor Analysis
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={riskFactorsData} layout="vertical" barSize={10}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 10, fill: "#68787A" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                  {riskFactorsData.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <h3
              className="font-semibold text-foreground text-sm mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Historical Trend
            </h3>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={healthTrendData}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8D9EA0" }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[35, 80]} />
                <Line type="monotone" dataKey="risk" stroke="#C0453A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
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
            <p className="text-sm text-muted-foreground leading-relaxed">
              The ensemble model assigns a{" "}
              <strong className="text-foreground">High Risk</strong> classification with 78/100
              score. Primary driver: fasting glucose of{" "}
              <strong className="text-foreground">158 mg/dL</strong>, which is above the diabetic
              threshold (≥126 mg/dL). Secondary drivers include BMI 33.1 (obese class I) and age 62
              (elevated baseline risk). The Neural Network and SVM models agree: both independently
              score above 75.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {MODELS.map((m) => (
                <div key={m.model} className="flex items-center justify-between p-2.5 rounded-lg bg-muted text-xs">
                  <span className="text-muted-foreground">{m.model}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground font-mono">{m.score}/100</span>
                    <CheckCircle size={11} className="text-[#C0453A]" />
                  </div>
                </div>
              ))}
            </div>
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
                  Recommended Immediate Actions
                </p>
                <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                  <li>Order HbA1c test — fasting glucose above diabetic threshold</li>
                  <li>Refer to endocrinology for evaluation</li>
                  <li>Discuss diabetes medication initiation</li>
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