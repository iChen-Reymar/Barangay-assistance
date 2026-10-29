"""Flask API exposing the vulnerability scoring models to the web application.

Endpoints
    GET  /api/health            liveness + whether a model is loaded
    GET  /api/model             metrics, tree rules, coefficients, importances
    POST /api/train             retrain on synthetic seed + real records
    POST /api/score             score raw beneficiary records

The service holds its model in memory and mirrors it to disk, so a restart keeps
the last trained state. If nothing has been trained yet it trains on first use.
"""

from __future__ import annotations

import os
import threading

import joblib
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

from dataset import build_dataset, dataset_summary, to_xy
from features import FEATURE_NAMES, human_readable, vectorize
from models import CLASS_ORDER, TREE_WEIGHT, LOGREG_WEIGHT, VulnerabilityScorer
from train import train_with_real_records

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "artifacts", "vulnerability_model.joblib")
METRICS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "artifacts", "metrics.json")
MIN_RECORDS_FOR_SCORE = 1

app = Flask(__name__)
CORS(app)

_state = {
    "scorer": None,
    "metrics": None,
    "summary": None,
    "trainedAt": None,
}
_lock = threading.Lock()


def _ensure_trained() -> None:
    """Load from disk, or train from scratch if there is nothing to load."""
    if _state["scorer"] is not None:
        return
    with _lock:
        if _state["scorer"] is not None:
            return
        if os.path.exists(MODEL_PATH) and os.path.exists(METRICS_PATH):
            try:
                payload = joblib.load(MODEL_PATH)
                import json

                with open(METRICS_PATH, "r", encoding="utf8") as handle:
                    disk = json.load(handle)
                _state["scorer"] = payload["scorer"]
                _state["metrics"] = disk["metrics"]
                _state["summary"] = disk["summary"]
                _state["trainedAt"] = disk["trainedAt"]
                return
            except Exception:
                pass  # corrupt or stale artifact: fall through and retrain
        _train_and_persist([])


def _train_and_persist(real_records: list[dict]) -> dict:
    from datetime import datetime, timezone

    scorer, metrics, summary = train_with_real_records(real_records)
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump({"scorer": scorer, "featureNames": FEATURE_NAMES}, MODEL_PATH)

    import json

    trained_at = datetime.now(timezone.utc).isoformat()
    with open(METRICS_PATH, "w", encoding="utf8") as handle:
        json.dump({"metrics": metrics, "summary": summary, "trainedAt": trained_at}, handle, indent=2)

    _state.update(
        scorer=scorer, metrics=metrics, summary=summary, trainedAt=trained_at
    )
    return {"metrics": metrics, "summary": summary, "trainedAt": trained_at}


def _normalise_records(payload) -> list[dict]:
    if isinstance(payload, dict):
        payload = payload.get("records") or payload.get("beneficiaries") or []
    if not isinstance(payload, list):
        return []
    return [item for item in payload if isinstance(item, dict)]


def _records_to_matrix(records: list[dict]) -> np.ndarray:
    return np.asarray([vectorize(record) for record in records], dtype=float)


@app.get("/api/health")
def health():
    _ensure_trained()
    return jsonify(
        {
            "ok": True,
            "service": "barangay-vulnerability-ml",
            "modelLoaded": _state["scorer"] is not None,
            "trainedAt": _state["trainedAt"],
            "features": FEATURE_NAMES,
            "classes": CLASS_ORDER,
            "ensembleWeights": {"decisionTree": TREE_WEIGHT, "logisticRegression": LOGREG_WEIGHT},
        }
    )


@app.get("/api/model")
def model_info():
    _ensure_trained()
    scorer: VulnerabilityScorer = _state["scorer"]
    return jsonify(
        {
            "trainedAt": _state["trainedAt"],
            "summary": _state["summary"],
            "metrics": _state["metrics"],
            "featureImportance": scorer.feature_importance(),
            "coefficients": scorer.coefficients(),
            "decisionTreeRules": scorer.tree_rules(),
            "featureNames": FEATURE_NAMES,
            "classes": CLASS_ORDER,
            "ensembleWeights": {"decisionTree": TREE_WEIGHT, "logisticRegression": LOGREG_WEIGHT},
            "targetAccuracy": 0.80,
        }
    )


@app.post("/api/train")
def train():
    records = _normalise_records(request.get_json(silent=True))
    with _lock:
        result = _train_and_persist(records)
    return jsonify({"ok": True, **result})


@app.post("/api/score")
def score():
    _ensure_trained()
    records = _normalise_records(request.get_json(silent=True))
    if len(records) < MIN_RECORDS_FOR_SCORE:
        return jsonify({"ok": False, "error": "No records supplied."}), 400

    scorer: VulnerabilityScorer = _state["scorer"]
    matrix = _records_to_matrix(records)
    results = scorer.score(matrix)

    payload = []
    for record, result in zip(records, results):
        payload.append(
            {
                "id": record.get("id"),
                "name": record.get("name"),
                "association": record.get("association"),
                "score": result["score"],
                "classification": result["classification"],
                "probabilities": result["probabilities"],
                "decisionTreePrediction": result["decisionTreePrediction"],
                "logisticRegressionPrediction": result["logisticRegressionPrediction"],
                "agreement": result["decisionTreePrediction"] == result["logisticRegressionPrediction"],
                "decisionTreePath": result["decisionTreePath"],
                "logisticContributions": result["logisticContributions"],
                "factors": human_readable(record),
            }
        )

    return jsonify(
        {
            "ok": True,
            "trainedAt": _state["trainedAt"],
            "modelMetrics": (_state["metrics"] or {}).get("blended"),
            "ensembleWeights": {"decisionTree": TREE_WEIGHT, "logisticRegression": LOGREG_WEIGHT},
            "results": payload,
        }
    )


@app.errorhandler(Exception)
def on_error(error):
    return jsonify({"ok": False, "error": str(error)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", "5050"))
    _ensure_trained()
    print(f"ML service listening on http://localhost:{port}")
    app.run(host="127.0.0.1", port=port, debug=False, threaded=True)
