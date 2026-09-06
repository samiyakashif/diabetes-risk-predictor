"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/user";

const RECENT_REPORTS = [
  { name: "Individual Risk Report — Alex Johnson", date: "May 20, 2026", type: "PDF", size: "248 KB" },
  { name: "Monthly Patient Summary", date: "May 01, 2026", type: "PDF", size: "1.2 MB" },
  { name: "Model Performance Report Q2", date: "Apr 30, 2026", type: "CSV", size: "82 KB" },
  { name: "Clinical Panel Review — May", date: "Apr 25, 2026", type: "PDF", size: "460 KB" },
];

export function ReportsView({ role }: { role: Role }) {
  const [reportType, setReportType] = useState("Individual Risk");

  const reportTypes =
    role === "admin"
      ? ["Model Performance", "System Usage", "User Analytics", "Training Summary"]
      : ["Individual Risk", "Monthly Summary", "Provider Panel", "Clinical Insights"];

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
                      onClick={() => setReportType(t)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                        reportType === t
                          ? "bg-secondary text-primary border-[#A8D9E2]"
                          : "bg-white text-muted-foreground border-border hover:border-gray-300"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <InputField label="Start Date" type="date" />
                <InputField label="End Date" type="date" />
              </div>
              <div className="flex gap-3 pt-2 flex-wrap">
                <Button variant="primary" icon={FileText}>
                  Generate Report
                </Button>
                <Button variant="outline" icon={Download}>
                  Download PDF
                </Button>
                <Button variant="outline" icon={Download}>
                  Download CSV
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-6">
            <h3
              className="font-semibold text-foreground text-sm mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Report Preview
            </h3>
            <div className="border-2 border-dashed border-border rounded-xl h-52 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <FileText size={32} className="opacity-30" />
              <p className="text-sm">
                Select report type and date range, then click Generate Report
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-6 h-fit">
          <h3
            className="font-semibold text-foreground text-sm mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Recent Reports
          </h3>
          <div className="flex flex-col gap-2">
            {RECENT_REPORTS.map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText size={14} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground leading-snug">{r.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.date} · {r.type} · {r.size}
                  </p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download size={13} className="text-muted-foreground hover:text-primary" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}