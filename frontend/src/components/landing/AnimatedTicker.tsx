"use client";

import {
  Activity,
  Users,
  Shield,
  Heart,
  CheckCircle,
  Brain,
  TrendingUp,
  Zap,
} from "lucide-react";

const TICKER_ITEMS = [
  { icon: Activity, label: "Live Predictions", value: "1,247 today" },
  { icon: Users, label: "Active Users", value: "8,412" },
  { icon: Shield, label: "Model Accuracy", value: "94.2%" },
  { icon: Heart, label: "Risks Detected", value: "312 this week" },
  { icon: CheckCircle, label: "Reports Generated", value: "2,841" },
  { icon: Brain, label: "ML Models Running", value: "4 in ensemble" },
  { icon: TrendingUp, label: "Risk Reduced", value: "18% avg this month" },
  { icon: Zap, label: "Avg Prediction Time", value: "< 200 ms" },
];

export function AnimatedTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div
      className="w-full bg-primary overflow-hidden border-b border-primary/80 relative"
      style={{ height: 38 }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, #0D7A8A, transparent)" }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, #0D7A8A, transparent)" }}
      />
      <div
        className="flex items-center h-full gap-0"
        style={{
          animation: "ticker-scroll 32s linear infinite",
          whiteSpace: "nowrap",
          width: "max-content",
        }}
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-8 h-full border-r border-white/10 flex-shrink-0"
          >
            <item.icon size={12} className="text-white/70" />
            <span className="text-xs text-white/70">{item.label}:</span>
            <span
              className="text-xs font-bold text-white"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}