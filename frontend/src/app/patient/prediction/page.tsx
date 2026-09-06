"use client";

import Link from "next/link";
import {
  Activity,
  AlertCircle,
  Download,
  Heart,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { RiskGauge } from "@/components/ui/RiskGauge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { RiskFactorsChart } from "@/components/dashboard/RiskFactorsChart";
import { usePrediction } from "@/components/prediction/PredictionProvider";
import {
  RISK_CONFIG,
  riskLevelFromProbability,
  riskScoreFromProbability,
} from "@/types/prediction";

const RECOMMENDATIONS = [
  {
    icon: Activity,
    title: "Increase physical activity",
    desc: "150 min/week moderate aerobic exercise. Start with 30-min walks.",
    color: "#2A9E6B",
    urgency: "High priority",
  },
  {
    icon: Heart,
    title: "Dietary changes",
    desc: "Reduce refined carbohydrates. Follow Mediterranean-style eating.",
    color: "#0D7A8A",
    urgency: "High priority",
  },
  {
    icon: Stethoscope,
    title: "Medical consultation",
    desc: "Schedule HbA1c test and consult your GP within 30 days.",
    color: "#C8821A",
    urgency: "Urgent",
  },
];

export default function PredictionPage() {
  const { prediction } = usePrediction();

  if (!prediction) {
    return (
      <div className="max-w-2xl">
        <SectionHeader title="Prediction Result" />
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <p className="text-muted-foreground mb-4">
            No prediction yet. Enter your health data to get a risk score.
          </p>
          <Link href="/patient/health-input">
            <Button variant="primary" icon={Activity}>
              Enter Health Data
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { result, features } = prediction;
  const level = riskLevelFromProbability(result.risk_probability);
  const score = riskScoreFromProbability(result.risk_probability);
  const config = RISK_CONFIG[level];
  const riskLabel = result.risk_label === "Diabetic" ? "Diabetic" : "Non-Diabetic";

  return (
    <div className="max-w-4xl">
      <SectionHeader
        title="Prediction Result"
        subtitle={`${riskLabel} · Risk score ${score}/100`}
      />

      <div
        className="rounded-xl p-6 mb-6 flex items-center gap-4"
        style={{
          backgroundColor: config.bg,
          border: `1.5px solid ${config.border}`,
        }}
      >
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${config.color}22` }}
        >
          <AlertCircle size={28} style={{ color: config.color }} />
        </div>
        <div className="flex-1">
          <h2
            className="text-xl font-bold"
            style={{ color: config.text, fontFamily: "var(--font-display)" }}
          >
            {config.label} Detected
          </h2>
          <p className="text-sm mt-1" style={{ color: config.text }}>
            Your risk score is {score}/100. Several biomarkers are elevated.
            Lifestyle changes and medical consultation are recommended.
          </p>
        </div>
        <RiskBadge level={level} size="lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="bg-white rounded-xl border border-border p-4 md:p-6 flex flex-col items-center gap-4 md:col-span-1">
          <h3
            className="font-semibold text-foreground text-sm self-start"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Risk Score
          </h3>
          <RiskGauge score={score} level={level} />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Ensemble confidence:{" "}
              <span className="font-semibold text-foreground font-mono">
                94.2%
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4 md:p-6 md:col-span-2">
          <h3
            className="font-semibold text-foreground text-sm mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Top Contributing Factors
          </h3>
          <RiskFactorsChart height={220} barSize={14} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h3
          className="font-semibold text-foreground mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          What this means for you
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your glucose level of{" "}
          <strong className="text-foreground">{features.Glucose} mg/dL</strong>{" "}
          is a key input to your risk assessment. Your BMI of{" "}
          <strong className="text-foreground">{features.BMI}</strong> compounds
          this risk. The good news: both factors are modifiable through diet,
          exercise, and medical management. With the right changes, risk
          reduction of 20–30% within 6 months is achievable.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        {RECOMMENDATIONS.map((r) => (
          <div key={r.title} className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${r.color}18` }}
              >
                <r.icon size={15} style={{ color: r.color }} />
              </div>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${r.color}18`, color: r.color }}
              >
                {r.urgency}
              </span>
            </div>
            <h4
              className="font-semibold text-sm text-foreground mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {r.title}
            </h4>
            <p className="text-xs text-muted-foreground">{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <Button variant="primary" icon={Download} onClick={() => window.print()}>
          Download Report
        </Button>
        <Link href="/patient/health-input">
          <Button variant="secondary" icon={RefreshCw}>
            Run Again
          </Button>
        </Link>
        <Link href="/patient">
          <Button variant="outline">View Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}