"use client";

import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Nutrition", "Exercise", "Medication", "Monitoring", "Mental Health", "Research"];

const ARTICLES = [
  { cat: "Nutrition", title: "Understanding the Glycemic Index", preview: "How different foods affect your blood sugar levels and why the GI matters for diabetes prevention.", readTime: "6 min" },
  { cat: "Exercise", title: "Exercise as Medicine: Glucose Control", preview: "Evidence-based exercise protocols that can lower HbA1c by up to 1.5% over 12 weeks.", readTime: "8 min" },
  { cat: "Monitoring", title: "How to Read Your Fasting Glucose Results", preview: "A clear guide to interpreting your glucose numbers and knowing when to seek medical attention.", readTime: "4 min" },
  { cat: "Medication", title: "Metformin: What to Expect", preview: "The most commonly prescribed diabetes drug — mechanism, side effects, and what clinical trials show.", readTime: "10 min" },
  { cat: "Mental Health", title: "Diabetes Distress and How to Manage It", preview: "Living with diabetes risk affects mental health. Evidence-based strategies for managing diabetes-related anxiety.", readTime: "7 min" },
  { cat: "Research", title: "The Diabetes Prevention Program Study", preview: "Key findings from the landmark DPP trial: lifestyle changes outperformed Metformin in preventing Type 2.", readTime: "12 min" },
  { cat: "Nutrition", title: "Mediterranean Diet & Diabetes Risk", preview: "A meta-analysis of 15 trials shows Mediterranean eating reduces incident diabetes by 19–23%.", readTime: "9 min" },
  { cat: "Exercise", title: "Resistance Training for Insulin Sensitivity", preview: "Strength training improves insulin sensitivity independently of aerobic exercise. Here's the protocol.", readTime: "7 min" },
];

const CAT_COLORS: Record<string, string> = {
  Nutrition: "#2A9E6B",
  Exercise: "#0D7A8A",
  Medication: "#6264A0",
  Monitoring: "#C8821A",
  "Mental Health": "#C0453A",
  Research: "#3A4E50",
};

export function ResourcesView() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = ARTICLES.filter(
    (a) =>
      (activeCategory === "All" || a.cat === activeCategory) &&
      (a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.preview.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <SectionHeader
        title="Educational Resources"
        subtitle="Evidence-based articles curated for patients and providers."
      />
      <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
        <div className="w-full sm:w-48 flex-shrink-0">
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Categories
            </p>
            <div className="flex flex-col gap-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={cn(
                    "text-left px-3 py-2 rounded-lg text-sm transition-all",
                    activeCategory === c
                      ? "bg-secondary text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="relative mb-5">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
              No articles match your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {filtered.map((a, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-border p-5 hover:border-[#A8D9E2] hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: CAT_COLORS[a.cat] || "#3A4E50" }}
                    >
                      {a.cat}
                    </span>
                    <span className="text-xs text-muted-foreground">{a.readTime} read</span>
                  </div>
                  <h4
                    className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {a.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{a.preview}</p>
                  <button className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    Read More <ChevronRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}