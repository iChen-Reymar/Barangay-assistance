"""Train both models on the synthetic seed plus real records, and report metrics.

Training pool, in order of how genuine the data is:

  1. real beneficiary records entered by staff  -> keep the staff-assigned label
  2. the 40-member ERPAT roster (real identity, imputed socioeconomic fields)
  3. synthetic households drawn from the barangay prior

Evaluation is deliberately harder than a single lucky split:

  * one untouched hold-out test set (25%, stratified) -> the headline numbers
  * 5-fold stratified cross-validation on the training split -> mean +/- std,
    so a "works" claim is not resting on one favourable draw

Both models are reported separately, plus the blend the system actually shows.
"""

from __future__ import annotations

import random

import numpy as np
from sklearn.model_selection import StratifiedKFold, train_test_split

from dataset import build_dataset, dataset_summary, to_xy
from models import VulnerabilityScorer, evaluate

TARGET_ACCURACY = 0.80  # the capstone's stated minimum for the blended model
N_SYNTHETIC = 8000
CV_FOLDS = 5


def _blended_predictions(scorer: VulnerabilityScorer, x: np.ndarray) -> list[str]:
    return [item["classification"] for item in scorer.score(x)]


def _cross_validate(x: np.ndarray, y: np.ndarray, seed: int, folds: int = CV_FOLDS) -> dict:
    """Stratified k-fold accuracy for each model and the blend, on the training split."""
    splitter = StratifiedKFold(n_splits=folds, shuffle=True, random_state=seed)
    tree_scores: list[float] = []
    logreg_scores: list[float] = []
    blended_scores: list[float] = []

    for train_idx, val_idx in splitter.split(x, y):
        fold_scorer = VulnerabilityScorer.train(x[train_idx], y[train_idx])
        x_val, y_val = x[val_idx], y[val_idx]

        y_true = y_val.tolist()
        tree_scores.append(evaluate(y_true, fold_scorer.tree.predict(x_val).tolist())["accuracy"])
        logreg_scores.append(evaluate(y_true, fold_scorer.logreg.predict(x_val).tolist())["accuracy"])
        blended_scores.append(evaluate(y_true, _blended_predictions(fold_scorer, x_val))["accuracy"])

    def pack(values: list[float]) -> dict:
        arr = np.asarray(values, dtype=float)
        return {
            "folds": [round(float(v), 4) for v in arr],
            "mean": round(float(arr.mean()), 4),
            "std": round(float(arr.std(ddof=1)), 4) if len(arr) > 1 else 0.0,
            "min": round(float(arr.min()), 4),
            "max": round(float(arr.max()), 4),
        }

    return {
        "folds": folds,
        "decisionTree": pack(tree_scores),
        "logisticRegression": pack(logreg_scores),
        "blended": pack(blended_scores),
    }


def train_with_real_records(
    real_records: list[dict] | None = None,
    seed: int = 42,
    n_synthetic: int = N_SYNTHETIC,
):
    """Train on synthetic seed data merged with the ERPAT roster and real records."""
    from real_data import roster_households, roster_summary

    # Real roster rows join the pool *before* the percentile cut, so their labels
    # sit on exactly the same scale as the synthetic ones (see build_dataset).
    roster_rng = random.Random(seed + 7)
    roster = roster_households(roster_rng)

    pool = build_dataset(n_samples=n_synthetic, seed=seed, extra_households=roster)
    roster_rows = len(roster)

    # Staff-entered records carry their own label - a human classification - so
    # they are appended with that label rather than re-derived.
    real_added = 0
    for record in real_records or []:
        label = str(record.get("vulnerability") or record.get("label") or "").upper()
        if label not in ("HIGH", "MEDIUM", "LOW"):
            continue
        pool.append({**record, "label": label})
        real_added += 1

    x, y = to_xy(pool)
    x = np.asarray(x, dtype=float)
    y = np.asarray(y)

    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.25, random_state=seed, stratify=y
    )

    scorer = VulnerabilityScorer.train(x_train, y_train)
    y_true = y_test.tolist()

    metrics = {
        "synthetic": evaluate(y_true, scorer.tree.predict(x_test).tolist()),
        "decisionTree": evaluate(y_true, scorer.tree.predict(x_test).tolist()),
        "logisticRegression": evaluate(y_true, scorer.logreg.predict(x_test).tolist()),
    }

    # The blended prediction is what the system actually shows users, so it is
    # the number worth putting the 80% target against.
    blended = _blended_predictions(scorer, x_test)
    metrics["blended"] = evaluate(y_true, blended)
    metrics["crossValidation"] = _cross_validate(x_train, y_train, seed)

    summary = dataset_summary(pool)
    summary.update(
        {
            "realRecordsIncluded": real_added,
            "realRosterRows": roster_rows,
            "roster": roster_summary(),
            "nSynthetic": n_synthetic,
            "trainSize": int(x_train.shape[0]),
            "testSize": int(x_test.shape[0]),
            "cvFolds": CV_FOLDS,
            "targetAccuracy": TARGET_ACCURACY,
            "meetsTarget": metrics["blended"]["accuracy"] >= TARGET_ACCURACY,
        }
    )

    return scorer, metrics, summary


if __name__ == "__main__":
    import json

    trained, results, info = train_with_real_records()

    print(json.dumps({"summary": info, "metrics": results}, indent=2))
    print("", flush=True)
    blended = results["blended"]
    cv = results["crossValidation"]["blended"]
    print(f"hold-out blended accuracy : {blended['accuracy']:.4f}")
    print(f"{CV_FOLDS}-fold CV blended   : {cv['mean']:.4f} +/- {cv['std']:.4f}  "
          f"(range {cv['min']:.4f}-{cv['max']:.4f})")
    print(f"decision tree             : {results['decisionTree']['accuracy']:.4f}")
    print(f"logistic regression       : {results['logisticRegression']['accuracy']:.4f}")
    print(f"target                    : >= {TARGET_ACCURACY:.2f}  "
          f"{'PASS' if info['meetsTarget'] else 'FAIL'}")
    raise SystemExit(0 if info["meetsTarget"] else 1)
