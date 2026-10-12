"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Brain, CheckCircle, Database, GitBranch, Layers, Play, TrendingUp, Upload, XCircle } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import type { DatasetInfo } from "@/types/settings";
import type { MaybeTrainedModel, TrainingJob } from "@/types/training";

const MODELS = [
  { id: "neural", label: "Neural Network", icon: Brain, desc: "MLP, single hidden layer (100), max_iter=1000" },
  { id: "svm", label: "Support Vector Machine", icon: GitBranch, desc: "RBF kernel, probability=True" },
  { id: "dt", label: "Decision Tree", icon: Layers, desc: "CART, random_state=42" },
  { id: "lr", label: "Logistic Regression", icon: TrendingUp, desc: "L2 regularization, random_state=42" },
];

const pct = (v?: number) => Math.round((v ?? 0) * 100) / 100;

export default function ModelTrainingPage() {
  const [selected, setSelected] = useState<string[]>(["neural", "svm", "dt", "lr"]);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState("");
  const [job, setJob] = useState<TrainingJob | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const info = await api.getDatasetInfo();
        if (!cancelled) setDataset(info);
      } catch {
        // keep static fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      if (!content) return;
      setImporting(true);
      setImportStatus(null);
      try {
        const res = await api.uploadDataset(content);
        setDataset(res);
        setImportStatus({ ok: true, message: `Dataset imported (${res.rows ?? "?"} rows)` });
      } catch (err) {
        setImportStatus({
          ok: false,
          message: err instanceof ApiError ? err.message : "Import failed",
        });
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const startTraining = async () => {
    setError("");
    setJob(null);
    setTraining(true);
    try {
      const created = await api.trainModels(selected);
      setJobId(created.job_id);
      setJob(created);
      pollJob(created.job_id);
    } catch (err) {
      setTraining(false);
      setError(err instanceof ApiError ? err.message : "Could not start training. Please try again.");
    }
  };

  const pollJob = async (id: string) => {
    const iv = window.setInterval(async () => {
      try {
        const status = await api.getTrainingStatus(id);
        setJob(status);
        if (status.status === "complete" || status.status === "failed") {
          window.clearInterval(iv);
          setTraining(false);
        }
      } catch {
        window.clearInterval(iv);
        setTraining(false);
      }
    }, 800);
  };

  const complete = job?.status === "complete";
  const failed = job?.status === "failed";

  const stateFor = (id: string): MaybeTrainedModel | undefined =>
    job?.models.find((m) => m.id === id);

  return (
    <>
      <SectionHeader
        title="Model Training"
        subtitle="Select models and initiate real training against the dataset."
      />

      <div className="bg-white rounded-xl border border-border p-5 mb-6 flex flex-wrap items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <Database size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-semibold text-foreground">
            Active Dataset: {dataset ? dataset.filename : "Pima Indians Diabetes Database"}
          </p>
          {dataset ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              {dataset.rows ?? "…"} records · {dataset.columns?.length ?? "…"} features
              {dataset.updated_at ? ` · updated ${new Date(dataset.updated_at).toLocaleString()}` : ""}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              Loading dataset info from the attached FastAPI backend…
            </p>
          )}
          {importStatus && (
            <p
              className={cn(
                "text-xs font-medium mt-1",
                importStatus.ok ? "text-[#2A9E6B]" : "text-destructive"
              )}
            >
              {importStatus.message}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={Upload}
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? "Importing..." : "Import New Dataset"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onImportFile}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
        {MODELS.map((m) => {
          const isSelected = selected.includes(m.id);
          const state = stateFor(m.id);
          const disabled = training && !isSelected;
          return (
            <div
              key={m.id}
              onClick={() => !training && toggle(m.id)}
              className={cn(
                "bg-white rounded-xl border p-5 transition-all",
                isSelected ? "border-primary shadow-sm shadow-primary/10" : "border-border",
                !training && isSelected && "cursor-pointer hover:border-[#A8D9E2]",
                disabled && "opacity-40"
              )}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isSelected ? "bg-secondary" : "bg-muted")}>
                  <m.icon
                    size={16}
                    className={isSelected ? "text-primary" : "text-muted-foreground"}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{m.label}</p>
                    <div
                      className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                        isSelected ? "bg-primary border-primary" : "border-gray-300"
                      )}
                    >
                      {isSelected && <CheckCircle size={10} className="text-white" />}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                </div>
              </div>
              {training && isSelected && state && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">
                      {state.status === "completed"
                        ? `Complete · Acc ${pct(state.accuracy)}%`
                        : state.status === "training"
                          ? `Training... · ${(state.progress ?? 0)}%`
                          : state.status === "failed"
                            ? "Failed"
                            : "Queued"}
                    </span>
                    <span className="text-xs font-mono font-semibold text-primary">
                      {Math.round(state.progress ?? 0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${state.progress ?? 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" size="lg" icon={Play} onClick={startTraining} disabled={training || selected.length === 0}>
          {training
            ? "Training in progress..."
            : `Train ${selected.length} Model${selected.length !== 1 ? "s" : ""}`}
        </Button>
        <p className="text-sm text-muted-foreground">
          {selected.length} of {MODELS.length} models selected
        </p>
      </div>

      {training && job && (
        <div className="mt-6 p-4 rounded-xl bg-secondary/60 border border-[#A8D9E2]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Job {job.job_id} · {job.current_step}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Overall progress {Math.round(job.progress)}%
              </p>
            </div>
            <div className="w-36">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${job.progress}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {failed && (
        <div className="mt-6 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
            <XCircle size={16} />
            Training failed: {job?.error ?? "Unknown error"}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
            <XCircle size={16} />
            {error}
          </div>
        </div>
      )}

      {complete && job?.best_model && (
        <div className="mt-6 p-4 rounded-xl bg-[#EEF9F4] border border-green-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[#1A6042] font-semibold text-sm">
              <CheckCircle size={16} />
              Training complete! Best model: {job.best_model.label} — {pct(job.models.find((m) => m.id === job.best_model?.id)?.accuracy)}% accuracy.
            </div>
            <Link href={`/admin/evaluation?job=${jobId ?? ""}`}>
              <Button variant="primary" size="sm">
                View Evaluation
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}