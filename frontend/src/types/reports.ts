export interface ReportSectionRow {
  label: string;
  value: string;
}

export interface ReportSection {
  title: string;
  rows: ReportSectionRow[];
}

export interface ReportSummary {
  title: string;
  generated_at: string;
  owner: string;
  role: string;
  sections: ReportSection[];
}

export interface GeneratedReportMeta {
  id: number;
  report_type: string;
  title: string;
  created_at: string | null;
}

export interface GenerateReportResponse extends GeneratedReportMeta {
  summary: ReportSummary;
}

export type ReportFormat = "csv" | "json";