"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import type { Role } from "@/types/user";
import type {
  GenerateReportResponse,
  GeneratedReportMeta,
  ReportFormat,
} from "@/types/reports";

const REPORT_TYPES: Record<Role, string[]> = {
  patient: ["individual_risk", "monthly_summary"],
  provider: ["panel_overview", "clinical_insights"],
  admin: ["model_performance", "system_usage", "user_analytics", "training_summary"],
};

const REPORT_LABELS: Record<string, string> = {
  individual_risk: "Individual Risk",
  monthly_summary: "Monthly Summary",
  panel_overview: "Provider Panel",
  clinical_insights: "Clinical Insights",
  model_performance: "Model Performance",
  system_usage: "System Usage",
  user_analytics: "User Analytics",
  training_summary: "Training Summary",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ReportsView({ role }: { role: Role }) {
  const reportTypes = REPORT_TYPES[role];
  const [selectedType, setSelectedType] = useState(reportTypes[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [recent, setRecent] = useState<GeneratedReportMeta[]>([]);
  const [preview, setPreview] = useState<GenerateReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<ReportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      try {
        const reports = await api.getRecentReports();
        if (!cancelled) {
          setRecent(reports);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load recent reports");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await api.generateReport(
        selectedType,
        startDate || undefined,
        endDate || undefined
      );
      setPreview(result);
      setRecent((prev) => [
        {
          id: result.id,
          report_type: result.report_type,
          title: result.title,
          created_at: result.created_at,
        },
        ...prev.filter((r) => r.id !== result.id),
      ]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not generate report");
    } finally {
      setGenerating(false);
    }
  }, [selectedType, startDate, endDate]);

  const handleOpenRecent = useCallback(async (reportId: number) => {
    setError(null);
    try {
      setPreview(await api.getReport(reportId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not open report");
    }
  }, []);

  const handleDownload = useCallback(
    async (reportId: number, title: string, format: ReportFormat) => {
      setDownloading(format);
      setError(null);
      try {
        const blob = await api.downloadReport(reportId, format);
        const base = title
          .replace(/[^a-zA-Z0-9 _-]/g, "")
          .trim()
          .replace(/\s+/g, "_");
        saveBlob(blob, `${base || "report"}.${format}`);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not download report");
      } finally {
        setDownloading(null);
      }
    },
    []
  );

  return (
    <>
      <SectionHeader
        title="Report Generation"
        subtitle="Generate, preview, and download clinical and administrative reports."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4 md:gap-5">
          <div className="bg-white rounded-xl border border-border p-6">
            <h3
              className="font-semibold text-foreground text-sm mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Report Configuration
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Report Type
                </label>
                <div className="flex gap-2 flex-wrap">
                  {reportTypes.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedType(t)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                        selectedType === t
                          ? "bg-secondary text-primary border-[#A8D9E2]"
                          : "bg-white text-muted-foreground border-border hover:border-gray-300"
                      )}
                    >
                      {REPORT_LABELS[t] ?? t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <InputField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={setStartDate}
                />
                <InputField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <div className="flex gap-3 pt-2 flex-wrap">
                <Button
                  variant="primary"
                  icon={generating ? Loader2 : FileText}
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  {generating ? "Generating..." : "Generate Report"}
                </Button>
                <Button
                  variant="outline"
                  icon={downloading === "csv" ? Loader2 : Download}
                  onClick={() => preview && handleDownload(preview.id, preview.title, "csv")}
                  disabled={!preview || downloading !== null}
                >
                  Download CSV
                </Button>
                <Button
                  variant="outline"
                  icon={downloading === "json" ? Loader2 : Download}
                  onClick={() => preview && handleDownload(preview.id, preview.title, "json")}
                  disabled={!preview || downloading !== null}
                >
                  Download JSON
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-semibold text-foreground text-sm"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Report Preview
              </h3>
              {preview && (
                <span className="text-xs text-muted-foreground">
                  {preview.title} · {formatDate(preview.created_at)}
                </span>
              )}
            </div>
            {preview ? (
              <div className="max-h-[420px] overflow-y-auto rounded-xl border border-border">
                <div className="p-5 space-y-5">
                  {preview.summary.sections.map((section) => (
                    <div key={section.title}>
                      <h4 className="text-sm font-semibold text-foreground mb-2">
                        {section.title}
                      </h4>
                      <table className="w-full text-xs">
                        <tbody>
                          {section.rows.map((row) => (
                            <tr key={row.label} className="border-b border-border/60 last:border-0">
                              <td className="py-1.5 pr-3 text-muted-foreground w-2/5">
                                {row.label}
                              </td>
                              <td className="py-1.5 text-foreground font-medium">
                                {row.value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-xl h-52 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <FileText size={32} className="opacity-30" />
                <p className="text-sm">
                  Select report type and date range, then click Generate Report
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 h-fit">
          <h3
            className="font-semibold text-foreground text-sm mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Recent Reports
          </h3>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-6 justify-center">
              <Loader2 size={16} className="animate-spin" /> Loading...
            </div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No reports generated yet
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recent.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors group cursor-pointer"
                  onClick={() => handleOpenRecent(r.id)}
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-snug">
                      {r.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(r.created_at)}
                    </p>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(r.id, r.title, "csv");
                    }}
                  >
                    <Download size={13} className="text-muted-foreground hover:text-primary" />
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