"""Regression tests for privacy-sensitive ML feature encoding."""

import unittest
from unittest.mock import patch

import app as ml_app
from app import _missing_assessment_fields, app

from features import (
    FEATURE_NAMES,
    INDICATOR_PWD,
    INDICATOR_YOUNG_CHILDREN,
    encode,
    vectorize,
)


class FeatureEncodingTests(unittest.TestCase):
    def test_identity_fields_never_change_model_features(self):
        household = {
            "familySize": 4,
            "monthlyIncome": 8000,
            "workingHouseholdMembers": 2,
            "age": 42,
            "employmentStatus": "seasonal worker",
            "housingCondition": "renter",
            "vulnerabilityIndicators": [INDICATOR_PWD],
        }
        first = {**household, "name": "BENEFICIARY-0001", "association": "Association A"}
        second = {**household, "name": "Different Person", "association": "Association B"}
        self.assertEqual(vectorize(first), vectorize(second))

    def test_invalid_financial_values_are_safely_bounded(self):
        encoded = encode({"familySize": 0, "monthlyIncome": -500})
        self.assertEqual(encoded["family_size"], 1.0)
        self.assertEqual(encoded["monthly_income"], 0.0)
        self.assertEqual(encoded["income_per_capita"], 0.0)

    def test_indicators_produce_expected_dependent_load(self):
        encoded = encode({
            "vulnerabilityIndicators": [INDICATOR_PWD, INDICATOR_YOUNG_CHILDREN],
        })
        self.assertEqual(encoded["has_pwd"], 1.0)
        self.assertEqual(encoded["has_young_children"], 1.0)
        self.assertEqual(encoded["dependent_load"], 2.0)

    def test_vector_order_matches_declared_schema(self):
        encoded = encode({})
        self.assertEqual(vectorize({}), [encoded[name] for name in FEATURE_NAMES])

    def test_operational_scoring_requires_measured_household_fields(self):
        incomplete = {
            "id": "member-1",
            "name": "Not a model feature",
            "familySize": 4,
            "monthlyIncome": 0,
            "vulnerabilityIndicators": [INDICATOR_PWD],
        }
        self.assertEqual(
            _missing_assessment_fields(incomplete),
            ["monthlyIncome", "age", "workingHouseholdMembers", "employmentStatus", "housingCondition"],
        )

    def test_complete_assessment_is_accepted_for_scoring(self):
        complete = {
            "familySize": 4,
            "monthlyIncome": 8000,
            "workingHouseholdMembers": 1,
            "age": 42,
            "employmentStatus": "Seasonal Worker",
            "housingCondition": "Light Materials",
        }
        self.assertEqual(_missing_assessment_fields(complete), [])

    def test_score_endpoint_rejects_incomplete_roster_records(self):
        with app.test_client() as client:
            response = client.post("/api/score", json={"records": [{
                "id": "member-1",
                "name": "Identity is not enough",
                "association": "Association A",
            }]})
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.get_json()["ok"])

    def test_score_endpoint_uses_model_loaded_during_cold_start(self):
        complete = {
            "id": "member-1",
            "name": "Complete Household",
            "association": "Association A",
            "familySize": 4,
            "monthlyIncome": 8000,
            "workingHouseholdMembers": 1,
            "age": 42,
            "employmentStatus": "Seasonal Worker",
            "housingCondition": "Light Materials",
            "vulnerabilityIndicators": [],
        }

        class ColdStartScorer:
            def score(self, matrix):
                self.matrix = matrix
                return [{
                    "score": 72.0,
                    "classification": "HIGH",
                    "probabilities": {"HIGH": 0.72, "MEDIUM": 0.2, "LOW": 0.08},
                    "decisionTreePrediction": "HIGH",
                    "logisticRegressionPrediction": "HIGH",
                    "decisionTreePath": [],
                    "logisticContributions": [],
                }]

        scorer = ColdStartScorer()

        def load_model():
            ml_app._state.update(
                scorer=scorer,
                metrics={"blended": {"accuracy": 0.85}},
                trainedAt="2026-11-24T00:00:00+00:00",
            )

        previous = ml_app._state.copy()
        ml_app._state["scorer"] = None
        try:
            with patch.object(ml_app, "_ensure_trained", side_effect=load_model):
                with app.test_client() as client:
                    response = client.post("/api/score", json={"records": [complete]})
        finally:
            ml_app._state.clear()
            ml_app._state.update(previous)

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()["ok"])
        self.assertEqual(response.get_json()["results"][0]["classification"], "HIGH")


if __name__ == "__main__":
    unittest.main()
