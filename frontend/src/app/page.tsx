"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart2,
  Brain,
  CheckCircle,
  ClipboardList,
  FileText,
  Shield,
  Star,
  Stethoscope,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { RiskGauge } from "@/components/ui/RiskGauge";
import { AnimatedTicker } from "@/components/landing/AnimatedTicker";
import { TopNav } from "@/components/landing/TopNav";
import { PulseRings } from "@/components/landing/PulseRings";
import { ParticleCanvas } from "@/components/landing/ParticleCanvas";
import { CountUp } from "@/components/landing/CountUp";
import { FloatingDataCard } from "@/components/landing/FloatingDataCard";

const FEATURES = [
  {
    icon: Activity,
    title: "AI Prediction",
    desc: "4 ML models working in ensemble to deliver accurate diabetes risk scores with clinical confidence intervals.",
  },
  {
    icon: BarChart2,
    title: "Smart Dashboard",
    desc: "Personalized health overviews with interactive charts tracking your risk trajectory over time.",
  },
  {
    icon: Shield,
    title: "Risk Analysis",
    desc: "Granular factor-level breakdown showing exactly which biomarkers are driving your risk score.",
  },
  {
    icon: Star,
    title: "Recommendations",
    desc: "Evidence-based lifestyle and clinical recommendations tailored to your individual risk profile.",
  },
  {
    icon: FileText,
    title: "Clinical Reports",
    desc: "Professional PDF reports suitable for sharing with your healthcare provider.",
  },
  {
    icon: Stethoscope,
    title: "Provider Tools",
    desc: "Dedicated dashboard for clinicians to monitor patient panels and access clinical decision support.",
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Enter Health Data",
    desc: "Input your basic health metrics — glucose, BMI, blood pressure, and more. Takes under 2 minutes.",
    icon: ClipboardList,
  },
  {
    n: "02",
    title: "AI Analysis",
    desc: "Our ensemble of 4 ML models analyzes your data against clinical population benchmarks.",
    icon: Brain,
  },
  {
    n: "03",
    title: "Get Insights",
    desc: "Receive a detailed risk score with factor breakdown, plain-language explanation, and recommendations.",
    icon: Activity,
  },
];

const STAT_STRIP = [
  { label: "Predictions made", value: 48291, suffix: "+" },
  { label: "Users protected", value: 8412, suffix: "" },
  { label: "Risk reductions", value: 76, suffix: "%" },
];

const HERO_METRICS = [
  { label: "Glucose", value: "131 mg/dL" },
  { label: "BMI", value: "28.1" },
  { label: "Blood Pressure", value: "131/84" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <AnimatedTicker />
      <TopNav />

      <section className="relative pt-28 pb-24 px-6 max-w-6xl mx-auto overflow-hidden">
        <PulseRings />
        <ParticleCanvas />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center relative z-10">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-[#A8D9E2] text-primary text-xs font-semibold mb-6"
              style={{ animation: "fade-in-up 0.6s ease both" }}
            >
              <Zap size={11} />
              Powered by Clinical-Grade Machine Learning
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-4 sm:mb-6"
              style={{ fontFamily: "var(--font-display)", animation: "fade-in-up 0.7s ease 0.1s both" }}
            >
              Predict Your
              <br />
              <span
                className="text-primary"
                style={{ animation: "shimmer-text 4s ease-in-out infinite" }}
              >
                Diabetes Risk
              </span>
              <br />
              with AI
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              DiabetaAI combines four machine learning models — Neural Network,
              SVM, Decision Tree, and Logistic Regression — to deliver highly
              accurate diabetes risk predictions from standard health metrics.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link href="/register">
                <Button variant="primary" size="lg" icon={ArrowRight}>
                  Get Your Risk Score
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Healthcare Provider Login
                </Button>
              </Link>
            </div>
            <div
              className="mt-8 flex items-center gap-6 text-sm text-muted-foreground"
              style={{ animation: "fade-in-up 0.7s ease 0.35s both" }}
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-[#2A9E6B]" />
                HIPAA-aligned
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-[#2A9E6B]" />
                <CountUp target={94} suffix="%" />
                accuracy
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-[#2A9E6B]" />
                Free to use
              </span>
            </div>

            <div
              className="mt-6 grid grid-cols-3 gap-2 sm:gap-3"
              style={{ animation: "fade-in-up 0.7s ease 0.45s both" }}
            >
              {STAT_STRIP.map((s) => (
                <div
                  key={s.label}
                  className="bg-white/80 backdrop-blur-sm rounded-xl border border-border px-3 py-2.5 text-center"
                >
                  <p
                    className="text-lg font-extrabold text-primary"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    <CountUp target={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ animation: "fade-in-up 0.8s ease 0.3s both" }}>
            <FloatingDataCard
              style={{ top: -18, left: -60 }}
              label="Glucose"
              value="131 mg/dL"
              color="#C8821A"
              delay="0s"
            />
            <FloatingDataCard
              style={{ bottom: 60, left: -72 }}
              label="HbA1c"
              value="6.1%"
              color="#2A9E6B"
              delay="0.8s"
            />
            <FloatingDataCard
              style={{ top: 80, right: -68 }}
              label="BMI"
              value="28.1"
              color="#6264A0"
              delay="1.4s"
            />
            <FloatingDataCard
              style={{ bottom: -16, right: 20 }}
              label="Risk Δ"
              value="-12%"
              color="#2A9E6B"
              delay="0.4s"
            />

            <div className="bg-white rounded-2xl border border-border p-6 shadow-xl shadow-[#0D7A8A]/8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-foreground">
                  Latest Prediction
                </span>
                <RiskBadge level="moderate" />
              </div>
              <RiskGauge score={62} level="moderate" />
              <div className="mt-4 grid grid-cols-3 gap-3">
                {HERO_METRICS.map((m) => (
                  <div key={m.label} className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p
                      className="text-sm font-semibold text-foreground mt-0.5"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-white border border-border rounded-xl px-3 py-2 shadow-lg text-xs font-semibold text-[#2A9E6B] items-center gap-1.5 hidden md:flex">
              <TrendingUp size={12} /> Risk Down 12% this month
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white border border-border rounded-xl px-3 py-2 shadow-lg text-xs font-semibold text-foreground items-center gap-1.5 hidden md:flex">
              <Brain size={12} className="text-primary" /> 4 Models in Ensemble
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-12 md:py-20 px-4 md:px-6 bg-white border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl font-bold text-foreground mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Everything you need to manage diabetes risk
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete platform for patients and clinicians, built around
              evidence-based prediction and actionable insights.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-xl border border-border hover:border-[#A8D9E2] hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-accent transition-colors">
                  <Icon size={18} className="text-primary" />
                </div>
                <h3
                  className="font-bold text-foreground mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-12 md:py-20 px-4 md:px-6 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2
            className="text-3xl font-bold text-foreground mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Three steps to your risk score
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
          <div className="absolute top-8 left-[calc(16.66%+16px)] right-[calc(16.66%+16px)] h-px bg-[#A8D9E2] hidden sm:block" />
          {HOW_IT_WORKS.map((s) => (
            <div key={s.n} className="flex flex-col items-center text-center relative">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/25 z-10 relative">
                <s.icon size={24} className="text-white" />
              </div>
              <span className="text-xs font-bold text-primary mb-1">{s.n}</span>
              <h3
                className="font-bold text-foreground mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {s.title}
              </h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/register">
            <Button variant="primary" size="lg" icon={ArrowRight}>
              Start for Free
            </Button>
          </Link>
        </div>
      </section>

      <footer id="resources" className="border-t border-border bg-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Activity size={12} className="text-white" />
            </div>
            <span className="font-semibold text-foreground">DiabetaAI</span>
          </div>
          <p>For informational purposes only. Not a substitute for professional medical advice.</p>
          <p>© 2026 DiabetaAI</p>
        </div>
      </footer>
    </div>
  );
}