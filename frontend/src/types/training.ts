export type ModelStatus = "pending" | "training" | "completed" | "failed";

export interface MaybeTrainedModel {
  id: string;
  label: string;
  status: ModelStatus;
  progress: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  confusion?: {
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
  n_test?: number;
}

export type TrainingJobStatus = "running" | "complete" | "failed";

export interface TrainingJob {
  job_id: string;
  status: TrainingJobStatus;
  progress: number;
  current_step: string;
  started_at: string;
  finished_at: string | null;
  models: MaybeTrainedModel[];
  error?: string | null;
  n_records?: number;
  best_model?: { id: string; label: string } | null;
}

export interface DeployResponse {
  message: string;
  model_id: string;
  model_label: string;
  model_type: string;
}