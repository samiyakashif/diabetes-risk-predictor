"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Loader2, Search, X } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import type { ResourceArticle, ResourceSummary } from "@/types/resources";

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
  const [resources, setResources] = useState<ResourceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ResourceArticle | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      try {
        const data = await api.getResources();
        if (!cancelled) {
          setResources(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof ApiError ? err.message : "Could not load resources"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(resources.map((r) => r.category))),
  ];

  const openArticle = async (slug: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const article = await api.getResource(slug);
      setDetail(article);
    } catch (err) {
      setDetailError(
        err instanceof ApiError ? err.message : "Could not load the article"
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = resources.filter(
    (a) =>
      (activeCategory === "All" || a.category === activeCategory) &&
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
              {categories.map((c) => (
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
          {loading ? (
            <div className="bg-white rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
              Loading resources…
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl border border-border p-10 text-center text-sm text-destructive">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
              No articles match your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {filtered.map((a) => (
                <div
                  key={a.slug}
                  className="bg-white rounded-xl border border-border p-5 hover:border-[#A8D9E2] hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: CAT_COLORS[a.category] || "#3A4E50" }}
                    >
                      {a.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{a.read_time} read</span>
                  </div>
                  <h4
                    className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {a.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">{a.preview}</p>
                  <button
                    onClick={() => openArticle(a.slug)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    Read More <ChevronRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white rounded-xl border border-border w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-lg fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: CAT_COLORS[detail.category] || "#3A4E50" }}
                  >
                    {detail.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{detail.read_time} read</span>
                </div>
                <h3
                  className="text-lg font-bold text-foreground"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {detail.title}
                </h3>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            {detailLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                <Loader2 size={16} className="animate-spin" /> Loading article…
              </div>
            ) : detailError ? (
              <p className="text-sm text-destructive py-4">{detailError}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {detail.body.map((para, i) => (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}