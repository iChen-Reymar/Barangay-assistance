"""Vulnerability scoring models: Decision Tree + Logistic Regression.

Two supervised classifiers are trained on the same labelled household data and
blended into one score. Both are deliberately interpretable, because a barangay
official has to be able to explain to a resident why they were or were not
recommended for aid.

    decision tree      -> an explicit rule path, e.g.
                          income_per_capita <= 3120.50 -> housing_score <= 2 -> HIGH
    logistic regression-> one signed coefficient per feature, so each factor can
                          be shown as points added to or taken from the score

The blended score is a convex combination of the two models' probability of
being HIGH or MEDIUM need.
"""

from __future__ import annotations

import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression

from features import FEATURE_NAMES

CLASS_ORDER = ["HIGH", "MEDIUM", "LOW"]
TREE_DEPTH = 6  # shallow enough that the printed rules stay readable
TREE_MIN_SAMPLES_LEAF = 12

# How much each model contributes to the final blended probability.
TREE_WEIGHT = 0.5
LOGREG_WEIGHT = 0.5

# Points awarded per unit of class probability when forming the 0-100 score.
_CLASS_POINTS = {"HIGH": 100.0, "MEDIUM": 55.0, "LOW": 15.0}


def build_pipelines() -> tuple[Pipeline, Pipeline]:
    """Decision tree pipeline and logistic regression pipeline."""
    tree = Pipeline(
        steps=[
            (
                "clf",
                DecisionTreeClassifier(
                    criterion="gini",
                    max_depth=TREE_DEPTH,
                    min_samples_leaf=TREE_MIN_SAMPLES_LEAF,
                    class_weight="balanced",
                    random_state=42,
                ),
            )
        ]
    )
    logreg = Pipeline(
        steps=[
            ("scale", StandardScaler()),
            (
                "clf",
                LogisticRegression(
                    max_iter=2000,
                    class_weight="balanced",
                    random_state=42,
                ),
            ),
        ]
    )
    return tree, logreg


def _label_index(label: str) -> int:
    return CLASS_ORDER.index(label)


def evaluate(y_true: list[str], y_pred: list[str]) -> dict:
    """Accuracy plus per-class precision/recall/f1 and the confusion matrix."""
    labels = [c for c in CLASS_ORDER if c in set(y_true) or c in set(y_pred)]
    matrix = confusion_matrix(y_true, y_pred, labels=labels)
    report = classification_report(
        y_true, y_pred, labels=labels, output_dict=True, zero_division=0
    )
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precisionMacro": round(float(precision_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "recallMacro": round(float(recall_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "f1Macro": round(float(f1_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "support": {label: int(report[label]["support"]) for label in labels},
        "perClass": {
            label: {
                "precision": round(float(report[label]["precision"]), 4),
                "recall": round(float(report[label]["recall"]), 4),
                "f1": round(float(report[label]["f1-score"]), 4),
            }
            for label in labels
        },
        "confusionMatrix": {
            "labels": labels,
            "rows": matrix.tolist(),
        },
    }


class VulnerabilityScorer:
    """Holds both trained models and produces blended, explainable scores."""

    def __init__(self, tree: Pipeline, logreg: Pipeline):
        self.tree = tree
        self.logreg = logreg
        self.classes_: list[str] = list(getattr(tree["clf"], "classes_", CLASS_ORDER))

    # -- training ---------------------------------------------------------

    @classmethod
    def train(cls, x_train: np.ndarray, y_train: np.ndarray) -> "VulnerabilityScorer":
        tree, logreg = build_pipelines()
        tree.fit(x_train, y_train)
        logreg.fit(x_train, y_train)
        return cls(tree, logreg)

    # -- prediction -------------------------------------------------------

    def _probabilities(self, x: np.ndarray) -> dict[str, np.ndarray]:
        """Aligned class probability columns from both models."""
        tree_proba = self.tree.predict_proba(x)
        logreg_proba = self.logreg.predict_proba(x)
        tree_classes = list(self.tree["clf"].classes_)
        logreg_classes = list(self.logreg["clf"].classes_)

        def align(proba, classes) -> np.ndarray:
            out = np.zeros((proba.shape[0], len(CLASS_ORDER)), dtype=float)
            for col, cls in enumerate(classes):
                if cls in CLASS_ORDER:
                    out[:, _label_index(cls)] = proba[:, col]
            total = out.sum(axis=1, keepdims=True)
            total[total == 0] = 1.0
            return out / total

        return {
            "tree": align(tree_proba, tree_classes),
            "logreg": align(logreg_proba, logreg_classes),
        }

    def score(self, x: np.ndarray) -> list[dict]:
        """Blended score, predicted class and both models' explanations."""
        proba = self._probabilities(x)
        blended = TREE_WEIGHT * proba["tree"] + LOGREG_WEIGHT * proba["logreg"]
        tree_pred = self.tree.predict(x)
        logreg_pred = self.logreg.predict(x)
        scaler = self.logreg["scale"]
        logreg_clf = self.logreg["clf"]
        coefficients = logreg_clf.coef_

        results = []
        for i in range(x.shape[0]):
            row = x[i]
            probabilities = {
                cls: float(blended[i, _label_index(cls)]) for cls in CLASS_ORDER
            }
            # Highest-probability class wins the label; score is the expected
            # point value across all three classes so that a borderline record
            # lands between the bands instead of snapping to a boundary.
            predicted = max(CLASS_ORDER, key=lambda cls: probabilities[cls])
            score = round(
                sum(probabilities[cls] * _CLASS_POINTS[cls] for cls in CLASS_ORDER), 1
            )
            score = float(min(100.0, max(0.0, score)))

            scaled = scaler.transform(row.reshape(1, -1))[0]
            contributions = sorted(
                (
                    {
                        "feature": FEATURE_NAMES[j],
                        "coefficient": round(float(logreg_clf.coef_[_label_index("HIGH"), j]), 4),
                        "contribution": round(float(coefficients[_label_index("HIGH"), j] * scaled[j]), 4),
                    }
                    for j in range(len(FEATURE_NAMES))
                ),
                key=lambda item: abs(item["contribution"]),
                reverse=True,
            )

            results.append(
                {
                    "classification": predicted,
                    "score": score,
                    "probabilities": probabilities,
                    "decisionTreePrediction": str(tree_pred[i]),
                    "logisticRegressionPrediction": str(logreg_pred[i]),
                    "decisionTreePath": self.explain_tree_path(row),
                    "logisticContributions": contributions,
                }
            )
        return results

    # -- explainability ---------------------------------------------------

    def explain_tree_path(self, row: np.ndarray) -> list[dict]:
        """The exact chain of tree splits this household travelled through."""
        tree_clf = self.tree["clf"]
        feature_names = FEATURE_NAMES
        node_indicator = tree_clf.decision_path(row.reshape(1, -1))
        node_indices = node_indicator.indices
        steps: list[dict] = []

        for position, node_id in enumerate(node_indices):
            if tree_clf.tree_.children_left[node_id] == tree_clf.tree_.children_right[node_id]:
                continue  # leaf reached
            feature_index = tree_clf.tree_.feature[node_id]
            threshold = float(tree_clf.tree_.threshold[node_id])
            value = float(row[feature_index])
            steps.append(
                {
                    "feature": feature_names[feature_index],
                    "operator": "<=" if value <= threshold else ">",
                    "threshold": round(threshold, 2),
                    "actualValue": round(value, 2),
                    "passed": value <= threshold,
                }
            )
        return steps

    def feature_importance(self) -> list[dict]:
        """Tree impurity-based importance, the model's own view of what matters."""
        importances = self.tree["clf"].feature_importances_
        ranked = sorted(
            (
                {"feature": FEATURE_NAMES[j], "importance": round(float(importances[j]), 4)}
                for j in range(len(FEATURE_NAMES))
            ),
            key=lambda item: item["importance"],
            reverse=True,
        )
        return ranked

    def coefficients(self) -> list[dict]:
        """Logistic regression coefficients for the HIGH class."""
        clf = self.logreg["clf"]
        index = _label_index("HIGH") if "HIGH" in list(clf.classes_) else 0
        return sorted(
            (
                {
                    "feature": FEATURE_NAMES[j],
                    "coefficient": round(float(clf.coef_[index, j]), 4),
                }
                for j in range(len(FEATURE_NAMES))
            ),
            key=lambda item: abs(item["coefficient"]),
            reverse=True,
        )

    def tree_rules(self) -> list[str]:
        """Human-readable rule list of the whole tree."""
        tree_clf = self.tree["clf"]
        tree = tree_clf.tree_
        rules: list[str] = []

        def walk(node: int, conditions: list[str]) -> None:
            if tree.children_left[node] == tree.children_right[node]:
                counts = tree.value[node][0]
                total = counts.sum()
                if total == 0:
                    return
                winner = int(np.argmax(counts))
                label = list(tree_clf.classes_)[winner]
                confidence = round(float(counts[winner]) / float(total), 2)
                prefix = " AND ".join(conditions) if conditions else "TRUE"
                rules.append(f"IF {prefix} THEN {label} (confidence {confidence})")
                return
            feature_index = tree.feature[node]
            threshold = float(tree.threshold[node])
            name = FEATURE_NAMES[feature_index]
            walk(
                int(tree.children_left[node]),
                conditions + [f"{name} <= {threshold:.2f}"],
            )
            walk(
                int(tree.children_right[node]),
                conditions + [f"{name} > {threshold:.2f}"],
            )

        walk(0, [])
        return rules
