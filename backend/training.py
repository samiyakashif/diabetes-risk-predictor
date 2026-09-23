"""Background job manager for the ML model training pipeline.

Jobs run in a daemon thread and report real progress through a callback.
Job state is kept in-memory (lost on server restart), which is acceptable
for this single-instance application.
"""

import os
import sys
import threading
import uuid
from datetime import datetime, timezone

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
    if not completed:
        return None
    return max(completed, key=lambda j: j.get("finished_at") or "")


def deploy_model(job_id: str, model_id: str):
    job = get_job(job_id)
    if not job:
        raise LookupError(f"Training job '{job_id}' not found")
    if job.get("status") != "complete":
        raise LookupError("Only completed training jobs can be deployed")

    tm = _import_trainer()
    return tm.deploy_models(job_id, model_id)