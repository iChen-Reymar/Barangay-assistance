"""Train both models on the synthetic seed plus any real records, and report metrics."""

from __future__ import annotations

import numpy as np
from sklearn.model_selection import train_test_split

from dataset import build_dataset, dataset_summary, to_xy
from models import VulnerabilityScorer, evaluate


def train_with_real_records(real_records: list[dict] | None = None, seed: int = 42):
    """Train on synthetic seed data merged with any real beneficiary records."""
    synthetic = build_dataset(n_samples=2400, seed=seed)
    pool = list(synthetic)

    # Real records carry their stored vulnerability as the label, which is how
    # barangay staff classified them. They are appended, not mixed in blindly:
    # if only a handful exist the synthetic pool still carries the signal.
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

    metrics = {
        "synthetic": evaluate(y_test.tolist(), scorer.tree.predict(x_test).tolist()),
        "decisionTree": evaluate(y_test.tolist(), scorer.tree.predict(x_test).tolist()),
        "logisticRegression": evaluate(y_test.tolist(), scorer.logreg.predict(x_test).tolist()),
    }

    # The blended prediction is what the system actually shows users, so it is
    # the number worth putting the 80% target against.
    blended = [item["classification"] for item in scorer.score(x_test)]
    metrics["blended"] = evaluate(y_test.tolist(), blended)

    summary = dataset_summary(pool)
    summary["realRecordsIncluded"] = real_added
    summary["trainSize"] = int(x_train.shape[0])
    summary["testSize"] = int(x_test.shape[0])

    return scorer, metrics, summary


if __name__ == "__main__":
    import json

    trained, results, info = train_with_real_records()
    print(json.dumps({"summary": info, "metrics": results}, indent=2))
