import {
  Activity,
  Brain,
  Clock,
  Heart,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

const RECS = [
  {
    cat: "Exercise",
    icon: Activity,
    color: "#2A9E6B",
    title: "Aerobic Exercise Program",
    desc: "150 minutes of moderate-intensity aerobic activity per week. Brisk walking, cycling, or swimming all qualify. Break it into 30-min daily sessions for easier adherence.",
    impact: "↓ 18% risk",
  },
  {
    cat: "Diet",
    icon: Heart,
    color: "#0D7A8A",
    title: "Mediterranean Dietary Pattern",
    desc: "High in vegetables, whole grains, olive oil, and lean protein. Limit processed carbohydrates and added sugars. Aim for a glycemic index below 55 for main meals.",
    impact: "↓ 22% risk",
  },
  {
    cat: "Monitoring",
    icon: Stethoscope,
    color: "#C8821A",
    title: "Schedule HbA1c Test",
    desc: "An HbA1c test gives a 3-month picture of average blood sugar. If above 5.7%, you are in the pre-diabetic range and immediate intervention is warranted.",
    impact: "Diagnostic",
  },
  {
    cat: "Weight",
    icon: TrendingUp,
    color: "#6264A0",
    title: "5–7% Body Weight Reduction",
    desc: "Losing just 5–7% of body weight (about 4–5 kg for you) can reduce diabetes risk by up to 58% in high-risk individuals, according to the DPP study.",
    impact: "↓ 58% risk",
  },
  {
    cat: "Sleep",
    icon: Clock,
    color: "#2A9E6B",
    title: "Optimize Sleep Quality",
    desc: "Poor sleep is associated with insulin resistance. Target 7–9 hours per night. Establish a consistent bedtime and reduce blue-light exposure after 9 PM.",
    impact: "↓ 9% risk",
  },
  {
    cat: "Stress",
    icon: Brain,
    color: "#C0453A",
    title: "Stress Management",
    desc: "Chronic stress elevates cortisol, which raises blood glucose. Mindfulness-based stress reduction (MBSR) programs have shown significant HbA1c improvements.",
    impact: "↓ 7% risk",
  },
];

export default function RecommendationsPage() {
  return (
    <>
      <SectionHeader
        title="Personalized Recommendations"
        subtitle="Evidence-based actions tailored to your current risk profile and biomarkers."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
        {RECS.map((r) => (
          <div
            key={r.title}
            className="bg-white rounded-xl border border-border p-5 flex gap-4 hover:border-[#A8D9E2] hover:shadow-sm transition-all"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${r.color}18` }}
            >
              <r.icon size={18} style={{ color: r.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: r.color }}
                >
                  {r.cat}
                </span>
                <span className="text-xs font-bold" style={{ color: r.color }}>
                  {r.impact}
                </span>
              </div>
              <h4
                className="font-semibold text-foreground mt-2 mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {r.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {r.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}