"""Background job manager for the ML model training pipeline.

Jobs run in a daemon thread and report real progress through a callback.
Job state is kept in-memory (lost on server restart), which is acceptable
for this single-instance application.
"""

import json
import os
import sys
import threading
import uuid
from datetime import datetime, timezone
from joblib import load as joblib_load

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "ml", "models"))

JOBS: dict[str, dict] = {}
_JOBS_LOCK = threading.Lock()

_trainer = None


def _import_trainer():
    global _trainer
    if _trainer is None:
        if MODELS_DIR not in sys.path:
            sys.path.insert(0, MODELS_DIR)
        import train_models

        _trainer = train_models
    return _trainer


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def model_labels() -> dict[str, str]:
    return dict(_import_trainer().MODEL_LABELS)


def valid_model_ids() -> list[str]:
    return list(_import_trainer().MODEL_LABELS.keys())


def _refresh(job_id: str, **fields):
    with _JOBS_LOCK:
        JOBS[job_id].update(fields)


def _run(job_id: str, model_ids: list[str]):
    tm = _import_trainer()

    def cb(progress: int, step: str, states):
        _refresh(job_id, progress=progress, current_step=step, models=states)

    try:
        result = tm.run_training(model_ids, job_id, progress_cb=cb)
        _refresh(
            job_id,
            status="complete",
            progress=100,
            current_step="Training complete",
            finished_at=_now_iso(),
            models=result["models"],
            results=result["results"],
            best_model=result["best_model"],
            n_records=result["n_records"],
        )
    except Exception as exc:  # pragma: no cover - defensive
        with _JOBS_LOCK:
            job = JOBS[job_id]
            for model in job.get("models", []):
                if model["status"] != "completed":
                    model["status"] = "failed"
            JOBS[job_id] = {
                **job,
                "status": "failed",
                "current_step": "Training failed",
                "finished_at": _now_iso(),
                "models": job.get("models", []),
                "error": str(exc),
            }


def start_training(model_ids: list[str]) -> dict:
    tm = _import_trainer()
    job_id = uuid.uuid4().hex[:12]
    initial_models = [
        {"id": mid, "label": tm.MODEL_LABELS[mid], "status": "pending", "progress": 0}
        for mid in model_ids
    ]
    job = {
        "job_id": job_id,
        "status": "running",
        "progress": 0,
        "current_step": "Queued",
        "started_at": _now_iso(),
        "finished_at": None,
        "models": initial_models,
        "error": None,
    }
    with _JOBS_LOCK:
        JOBS[job_id] = job
    threading.Thread(target=_run, args=(job_id, model_ids), daemon=True).start()
    return dict(job)


def get_job(job_id: str) -> dict | None:
    return JOBS.get(job_id)


def get_latest_completed() -> dict | None:
    completed = [j for j in JOBS.values() if j.get("status") == "complete"]
    if completed:
        return max(completed, key=lambda j: j.get("finished_at") or "")
    job_id = latest_completed_job_dir()
    if not job_id:
        return None
    tm = _import_trainer()
    try:
        with open(os.path.join(tm.ARTIFACT_DIR, job_id, "results.json")) as f:
            payload = json.load(f)
    except (OSError, ValueError):
        return None
    return {
        "job_id": payload.get("job_id", job_id),
        "status": "complete",
        "progress": 100,
        "current_step": "Training complete",
        "started_at": None,
        "finished_at": None,
        "models": payload.get("models", []),
        "results": payload.get("results", {}),
        "best_model": payload.get("best_model"),
        "n_records": payload.get("n_records"),
        "error": None,
    }


def latest_completed_job_dir() -> str | None:
    """Newest artifact dir on disk holding a results.json (survives restarts)."""
    tm = _import_trainer()
    try:
        candidates = [
            entry
            for entry in os.listdir(tm.ARTIFACT_DIR)
            if os.path.isfile(os.path.join(tm.ARTIFACT_DIR, entry, "results.json"))
        ]
    except FileNotFoundError:
        return None
    if not candidates:
        return None
    return max(
        candidates,
        key=lambda d: os.path.getmtime(os.path.join(tm.ARTIFACT_DIR, d, "results.json")),
    )


def deploy_model(job_id: str, model_id: str):
    job = get_job(job_id)
    if not job:
        raise LookupError(f"Training job '{job_id}' not found")
    if job.get("status") != "complete":
        raise LookupError("Only completed training jobs can be deployed")

    tm = _import_trainer()
    return tm.deploy_models(job_id, model_id)


def job_counts() -> dict:
    with _JOBS_LOCK:
        values = list(JOBS.values())
    return {
        "total": len(values),
        "running": sum(1 for j in values if j.get("status") == "running"),
        "completed": sum(1 for j in values if j.get("status") == "complete"),
        "failed": sum(1 for j in values if j.get("status") == "failed"),
    }


def latest_completed_job_id() -> str | None:
    job = get_latest_completed()
    return job["job_id"] if job else None


_JOB_PIPELINE_CACHE: dict[str, tuple] = {}


def job_model_scores(job_id: str | None, raw_row: list[float]) -> list[dict] | None:
    """Risk scores (0-100) from every trained model in the latest completed job.

    Models are loaded lazily and cached per job. Returns ``None`` when no
    completed job (or its artifacts) exists yet.
    """
    if not job_id:
        return None

    if job_id not in _JOB_PIPELINE_CACHE:
        tm = _import_trainer()
        job_dir = os.path.join(tm.ARTIFACT_DIR, job_id)
        scaler_path = os.path.join(job_dir, "scaler.joblib")
        if not os.path.isdir(job_dir) or not os.path.isfile(scaler_path):
            return None

        scaler = joblib_load(scaler_path)
        models = {}
        for model_id in tm.MODEL_LABELS.keys():
            path = os.path.join(job_dir, f"{model_id}_model.joblib")
            if os.path.isfile(path):
                models[model_id] = joblib_load(path)
        feature_names = None
        try:
            with open(os.path.join(job_dir, "feature_order.json")) as f:
                feature_names = json.load(f)
        except (OSError, ValueError):
            feature_names = None
        _JOB_PIPELINE_CACHE[job_id] = (scaler, models, feature_names)

    scaler, models, feature_names = _JOB_PIPELINE_CACHE[job_id]
    if not models:
        return None

    import numpy as np

    if feature_names:
        import pandas as pd

        input_frame = pd.DataFrame([raw_row], columns=feature_names)
        scaled = scaler.transform(input_frame)
    else:
        scaled = scaler.transform(np.array([raw_row]))
    return [
        {
            "model": _import_trainer().MODEL_LABELS[model_id],
            "score": round(float(ml.predict_proba(scaled)[0][1]) * 100),
        }
        for model_id, ml in sorted(models.items())
    ]