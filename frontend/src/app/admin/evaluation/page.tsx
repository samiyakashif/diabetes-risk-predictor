"use client";

import { Star } from "lucide-react";
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
import { modelMetrics } from "@/lib/demo-data";

const CONFUSION = [
  { label: "TP", value: 142, color: "#2A9E6B" },
  { label: "FP", value: 12, color: "#EDAEAA" },
  { label: "FN", value: 18, color: "#EDAEAA" },
  { label: "TN", value: 212, color: "#A8E2C8" },
];

const RADAR_DATA = [
  { metric: "Accuracy", NN: 94.2, SVM: 91.7, DT: 87.3, LR: 89.1 },
  { metric: "Precision", NN: 93.8, SVM: 90.2, DT: 86.1, LR: 88.7 },
  { metric: "Recall", NN: 91.4, SVM: 89.6, DT: 88.4, LR: 87.9 },
  { metric: "F1", NN: 92.6, SVM: 89.9, DT: 87.2, LR: 88.3 },
];

export default function ModelEvaluationPage() {
  return (
    <>
      <SectionHeader
        title="Model Evaluation"
        subtitle="Compare performance metrics across all trained models."
      />

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
              {modelMetrics.map((m, i) => (
                <tr
                  key={i}
                  className={cn("border-b border-border last:border-0", m.status === "best" && "bg-secondary/50")}
                >
                  <td className="px-6 py-4 text-sm font-semibold text-foreground">
                    <span className="flex items-center gap-1.5">
                      {m.status === "best" && <Star size={13} className="text-primary" />}
                      {m.model}
                    </span>
                  </td>
                  {[m.accuracy, m.precision, m.recall, m.f1].map((v, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-mono font-semibold"
                          style={{ color: m.status === "best" ? "#0D7A8A" : "#3A4E50" }}
                        >
                          {v}%
                        </span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full max-w-16">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${v}%`,
                              backgroundColor: m.status === "best" ? "#0D7A8A" : "#8D9EA0",
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
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
            Confusion Matrix — Neural Network
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Test set: 384 samples</p>
          <div className="grid grid-cols-2 gap-2 max-w-36 sm:max-w-48 mx-auto">
            {CONFUSION.map((c) => (
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
            <RadarChart data={RADAR_DATA}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <Radar dataKey="NN" stroke="#0D7A8A" fill="#0D7A8A" fillOpacity={0.15} name="Neural Net" />
              <Radar dataKey="SVM" stroke="#2A9E6B" fill="#2A9E6B" fillOpacity={0.1} name="SVM" />
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
          <h3
            className="font-bold text-[#0A5F6C]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Recommended: Neural Network
          </h3>
          <p className="text-sm text-[#2A93A8] mt-0.5">
            Highest accuracy (94.2%) and F1-score (92.6%) across all 4 metrics. Suitable for
            clinical deployment.
          </p>
        </div>
        <Button variant="primary">Deploy Model</Button>
      </div>
    </>
  );
}