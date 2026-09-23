"""
Diabetes risk-predictor model training pipeline.

Mirrors `ml/notebooks/02_model_training.ipynb` so the trained artifacts are
drop-in replacements for the deployed `diabetes_model.pkl` / `scaler.pkl`.

Can be run standalone:
    python ml/models/train_models.py [model_id ...] [--job JOB_ID]

Or imported by the backend (`backend/training.py`) which orchestrates a
background job and reports real progress via `progress_cb`.
"""

import json
import os
import shutil
import sys
import argparse

os.environ.setdefault("PYTHONIOENCODING", "utf-8")

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "data", "Diabetes.csv")
ARTIFACT_DIR = os.path.join(BASE_DIR, "trained")

IMPUTE_COLS = ["Glucose", "BloodPressure", "SkinThickness", "Insulin", "BMI"]

MODELS = {
    "neural": {
        "label": "Neural Network",
        "desc": "MLP, single hidden layer (100), max_iter=1000",
        "factory": lambda: MLPClassifier(random_state=42, max_iter=1000),
    },
    "svm": {
        "label": "Support Vector Machine",
        "desc": "RBF kernel, probability=True",
        "factory": lambda: SVC(probability=True, random_state=42),
    },
    "dt": {
        "label": "Decision Tree",
        "desc": "CART, random_state=42",
        "factory": lambda: DecisionTreeClassifier(random_state=42),
    },
    "lr": {
        "label": "Logistic Regression",
        "desc": "L2 regularization, random_state=42",
        "factory": lambda: LogisticRegression(random_state=42),
    },
}

MODEL_LABELS = {mid: spec["label"] for mid, spec in MODELS.items()}

COLUMN_RENAMES = {
    "preg": "Pregnancies",
    "plas": "Glucose",
    "pres": "BloodPressure",
    "Skin": "SkinThickness",
    "test": "Insulin",
    "mass": "BMI",
    "pedi": "DiabetesPedigree",
    "age": "Age",
    "class": "Outcome",
}


def _series_median(series):
    return float(series.median())


def prepare_data():
    df = pd.read_csv(DATA_PATH)
    df.columns = df.columns.str.strip()
    df.rename(columns=COLUMN_RENAMES, inplace=True)
    df = df.drop_duplicates()

    df[IMPUTE_COLS] = df[IMPUTE_COLS].replace(0, np.nan)
    for col in IMPUTE_COLS:
        df[col] = df[col].fillna(df[col].median())

    X = df.drop("Outcome", axis=1)
    y = df["Outcome"]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.3, random_state=42, stratify=y
    )

    medians = {col: _series_median(df[col]) for col in IMPUTE_COLS}
    return X_train, X_test, y_train, y_test, scaler, medians, X.columns.tolist(), int(len(df))


def _evaluate(model, X_test, y_test):
    y_pred = model.predict(X_test)
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    return {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred)), 4),
        "recall": round(float(recall_score(y_test, y_pred)), 4),
        "f1": round(float(f1_score(y_test, y_pred)), 4),
        "confusion": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "n_test": int(len(y_test)),
    }


def run_training(model_ids, job_id, progress_cb=None):
    model_ids = [mid for mid in model_ids if mid in MODELS]

    def report(progress, step, states=None):
        if progress_cb:
            progress_cb(progress, step, states)

    def initial_states():
        return [
            {"id": mid, "label": MODELS[mid]["label"], "status": "pending", "progress": 0}
            for mid in model_ids
        ]

    report(4, "Loading dataset...", initial_states())
    X_train, X_test, y_train, y_test, scaler, medians, feature_order, n_rows = prepare_data()
    report(18, f"Preprocessing {n_rows} records and scaling features...")

    trained = {}
    states = initial_states()
    n = max(len(model_ids), 1)

    for i, mid in enumerate(model_ids):
        for s in states:
            if s["id"] == mid:
                s["status"] = "training"
                s["progress"] = 35
                break
        report(24 + int(55 * i / n), f"Training {MODELS[mid]['label']}...", list(states))

        trained[mid] = MODELS[mid]["factory"]().fit(X_train, y_train)

        for s in states:
            if s["id"] == mid:
                s["status"] = "completed"
                s["progress"] = 100
                break

    report(82, "Evaluating all models on the hold-out test set...", list(states))

    results = {}
    for mid, model in trained.items():
        results[mid] = _evaluate(model, X_test, y_test)

    report(92, "Saving models and metrics...", list(states))

    job_dir = os.path.join(ARTIFACT_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    for mid, model in trained.items():
        joblib.dump(model, os.path.join(job_dir, f"{mid}_model.joblib"))
    joblib.dump(scaler, os.path.join(job_dir, "scaler.joblib"))

    with open(os.path.join(job_dir, "feature_order.json"), "w") as f:
        json.dump(feature_order, f)
    with open(os.path.join(job_dir, "medians.json"), "w") as f:
        json.dump(medians, f)

    best_id = max(results, key=lambda mid: (results[mid]["f1"], results[mid]["accuracy"]))

    completed_states = []
    for s in states:
        done = dict(s)
        if done["status"] == "completed" and done["id"] in results:
            done.update(results[done["id"]])
        completed_states.append(done)

    payload = {
        "job_id": job_id,
        "models": completed_states,
        "results": results,
        "best_model": {"id": best_id, "label": MODELS[best_id]["label"]},
        "n_records": n_rows,
        "artifacts_dir": job_dir,
    }

    with open(os.path.join(job_dir, "results.json"), "w") as f:
        json.dump(payload, f, indent=2)

    report(100, "Training complete", completed_states)
    return payload


def deploy_models(job_id, model_id, artifacts_dir=ARTIFACT_DIR, models_dir=BASE_DIR):
    job_dir = os.path.join(artifacts_dir, job_id)
    if not os.path.isdir(job_dir):
        raise FileNotFoundError(f"Training job '{job_id}' has no saved artifacts")
    if not os.path.isfile(os.path.join(job_dir, f"{model_id}_model.joblib")):
        raise FileNotFoundError(f"Model '{model_id}' not found in job '{job_id}'")

    model = joblib.load(os.path.join(job_dir, f"{model_id}_model.joblib"))
    scaler = joblib.load(os.path.join(job_dir, "scaler.joblib"))

    joblib.dump(model, os.path.join(models_dir, "diabetes_model.pkl"))
    joblib.dump(scaler, os.path.join(models_dir, "scaler.pkl"))

    for artifact in ("feature_order.json", "medians.json"):
        shutil.copyfile(os.path.join(job_dir, artifact), os.path.join(models_dir, artifact))

    return model, scaler


def main(argv=None):
    parser = argparse.ArgumentParser(description="Train the diabetes risk-predictor models.")
    parser.add_argument("model_ids", nargs="*", default=list(MODELS.keys()))
    parser.add_argument("--job", default=None, help="Job id (defaults to a generated hex id)")
    args = parser.parse_args(argv)

    unknown = [mid for mid in args.model_ids if mid not in MODELS]
    if unknown:
        print(f"Unknown model ids: {unknown}; valid: {list(MODELS.keys())}", file=sys.stderr)
        return 1

    job_id = args.job or __import__("uuid").uuid4().hex[:12]

    def cb(progress, step, states):
        statuses = ", ".join(f"{s['id']}={s['status']}" for s in (states or []))
        print(f"[{job_id}] {progress:3d}%  {step}  {statuses}")

    payload = run_training(args.model_ids, job_id, progress_cb=cb)
    print("\nTraining complete.")
    for mid, res in payload["results"].items():
        label = MODEL_LABELS[mid]
        print(
            f"  {label:<22} acc={res['accuracy']:.4f} "
            f"prec={res['precision']:.4f} rec={res['recall']:.4f} f1={res['f1']:.4f}"
        )
    print(f"\nBest model: {payload['best_model']['label']}")
    print(f"Artifacts: {payload['artifacts_dir']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())