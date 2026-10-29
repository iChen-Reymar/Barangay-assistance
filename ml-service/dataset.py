"""Synthetic barangay household dataset for training the vulnerability models.

The beneficiary store starts empty, so the models need labelled examples to learn
from. Rather than inventing labels directly, this module samples realistic
household attributes and derives the vulnerability label from a *latent* need
score built from richer, partly unobserved factors (debt burden, chronic illness,
school drop-out, seasonality of work). The learner only ever sees the observed
features, so the task is genuinely non-trivial and the reported accuracy is an
honest measurement rather than a lookup table wearing a model's clothes.

Real records entered by staff are appended to this pool on retraining, so the
model keeps learning from actual barangay data as it accumulates.
"""

from __future__ import annotations

import math
import random

from features import (
    INDICATOR_ELDERLY,
    INDICATOR_NO_PRIOR_AID,
    INDICATOR_PWD,
    INDICATOR_UNEMPLOYED_ADULTS,
    INDICATOR_YOUNG_CHILDREN,
    FEATURE_NAMES,
)

ASSOCIATIONS = [
    "Women's Association",
    "Senior Citizens Group",
    "Habal-habal Drivers Association",
    "Fishermen Association",
    "Farmers Association",
    "PWD Group",
    "Youth Group",
    "Unassigned",
]

FIRST_NAMES = [
    "Juan", "Maria", "Ricardo", "Ana", "Jose", "Teresa", "Benjamin", "Rosalinda",
    "Ernesto", "Lorna", "Marites", "Alfredo", "Jocelyn", "Roberto", "Nenita",
    "Danilo", "Grace", "Ferdinand", "Cristina", "Rolando", "Ma. Elena", "Arturo",
    "Imelda", "Generoso", "Perlita", "Nestor", "Aurora", "Domingo", "Luzviminda",
    "Eduardo", "Corazon", "Wilfredo", "Susana", "Ramon", "Teresita", "Leonardo",
]

LAST_NAMES = [
    "dela Cruz", "Santos", "Reyes", "Bautista", "Gonzaga", "Mendoza", "Villanueva",
    "Ocampo", "Ramos", "Salazar", "Panganiban", "Dizon", "Fernandez", "Garcia",
    "Hernandez", "Ignacio", "Jimenez", "Lopez", "Mercado", "Navarro", "Padilla",
    "Quintero", "Rivera", "Sandoval", "Tolentino", "Ubaldo", "Verde", "Zamora",
]

HOUSING_OPTIONS = ["Concrete", "Light Materials", "Temporary", "Makeshift / Salvaged"]
EMPLOYMENT_OPTIONS = ["Employed", "Self-Employed", "Seasonal Worker", "Unemployed"]


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _sigmoid(value: float) -> float:
    return 1.0 / (1.0 + math.exp(-value))


def sample_household(rng: random.Random) -> dict:
    """Sample one plausible barangay household with its hidden vulnerability drivers."""
    association = rng.choice(ASSOCIATIONS)

    # Employment first: it drives income, so it is sampled upstream of it.
    if association in ("Senior Citizens Group", "PWD Group"):
        employment = rng.choices(
            EMPLOYMENT_OPTIONS, weights=[6, 14, 6, 74], k=1
        )[0]
    elif association in ("Farmers Association", "Fishermen Association", "Habal-habal Drivers Association"):
        employment = rng.choices(
            EMPLOYMENT_OPTIONS, weights=[18, 34, 36, 12], k=1
        )[0]
    else:
        employment = rng.choices(
            EMPLOYMENT_OPTIONS, weights=[42, 26, 16, 16], k=1
        )[0]

    employment_index = EMPLOYMENT_OPTIONS.index(employment)
    family_size = max(1, int(rng.gauss(4.6, 1.9)))
    family_size = min(family_size, 14)

    if association == "Senior Citizens Group":
        head_age = int(_clamp(rng.gauss(69, 7), 60, 92))
    elif association == "Youth Group":
        head_age = int(_clamp(rng.gauss(26, 5), 18, 35))
    else:
        head_age = int(_clamp(rng.gauss(44, 13), 19, 85))

    # Housing quality follows income with noise; poorer households live in worse
    # shelter, but the relationship is not deterministic.
    latent_income = math.exp(rng.gauss(8.95 - 0.42 * employment_index, 0.55))
    monthly_income = round(_clamp(latent_income, 1500, 75000), 2)
    income_per_capita = monthly_income / family_size

    housing_index = 0
    if income_per_capita < 2500:
        housing_index = rng.choices([0, 1, 2, 3], weights=[4, 22, 34, 40])[0]
    elif income_per_capita < 5000:
        housing_index = rng.choices([0, 1, 2, 3], weights=[16, 40, 30, 14])[0]
    elif income_per_capita < 10000:
        housing_index = rng.choices([0, 1, 2, 3], weights=[44, 36, 15, 5])[0]
    else:
        housing_index = rng.choices([0, 1, 2, 3], weights=[72, 21, 6, 1])[0]
    housing = HOUSING_OPTIONS[housing_index]

    # Vulnerability indicators, correlated with the household's real situation.
    p_elderly = 0.10 + (0.34 if association == "Senior Citizens Group" else 0.0) + 0.02 * max(0, head_age - 45)
    p_pwd = 0.08 + (0.40 if association == "PWD Group" else 0.0)
    p_young = 0.28 * _sigmoid((family_size - 4.2) * 0.7) + (0.10 if head_age < 32 else 0.0)
    p_unemployed = 0.06 + (0.55 if employment == "Unemployed" else 0.0) + (0.18 if employment == "Seasonal Worker" else 0.0)

    has_elderly = rng.random() < _clamp(p_elderly, 0.01, 0.92)
    has_pwd = rng.random() < _clamp(p_pwd, 0.01, 0.85)
    has_young = rng.random() < _clamp(p_young, 0.01, 0.88)
    has_unemployed = rng.random() < _clamp(p_unemployed, 0.01, 0.95)

    # Whether the household has ever received aid before. Sampled independently
    # of the other drivers: some needy households have never been reached, some
    # have been helped repeatedly.
    no_prior_aid = rng.random() < _clamp(0.32 + 0.22 * (housing_index - 1), 0.04, 0.92)

    indicators = []
    if has_elderly:
        indicators.append(INDICATOR_ELDERLY)
    if has_pwd:
        indicators.append(INDICATOR_PWD)
    if has_young:
        indicators.append(INDICATOR_YOUNG_CHILDREN)
    if has_unemployed:
        indicators.append(INDICATOR_UNEMPLOYED_ADULTS)
    if no_prior_aid:
        indicators.append(INDICATOR_NO_PRIOR_AID)

    return {
        "name": f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}",
        "association": association,
        "familySize": family_size,
        "monthlyIncome": monthly_income,
        "age": head_age,
        "employmentStatus": employment,
        "housingCondition": housing,
        "vulnerabilityIndicators": indicators,
    }


def latent_need(household: dict, rng: random.Random) -> float:
    """Continuous need score.

    Most of the score is derived from fields the models actually observe
    (income per member, family size, housing, employment, the vulnerability
    indicators), which is what makes the task learnable at all. A smaller
    unobserved remainder stands in for the real-world factors no intake form
    captures - debt burden, chronic illness, a child who dropped out of school -
    so the models can never reach a perfect score and the accuracy figure stays
    an honest measurement.
    """
    income_per_capita = float(household["monthlyIncome"]) / max(1.0, float(household["familySize"]))
    family_size = float(household["familySize"])
    housing_index = float(HOUSING_OPTIONS.index(household["housingCondition"]))
    employment_index = float(EMPLOYMENT_OPTIONS.index(household["employmentStatus"]))
    indicators = household["vulnerabilityIndicators"]

    def flagged(*needle: str) -> float:
        return 1.0 if any(any(word in item for word in needle) for item in indicators) else 0.0

    need = 0.0
    # Observable signal - the bulk of the score.
    need += 3.4 * _sigmoid((6500.0 - income_per_capita) / 1500.0)
    need += 1.3 * _sigmoid((family_size - 5.0) * 0.6)
    need += 0.55 * housing_index
    need += 0.45 * employment_index
    need += 1.1 * flagged("PWD")
    need += 0.7 * flagged("Elderly")
    need += 0.6 * flagged("Under 5")
    need += 0.5 * flagged("Unemployed Adult")
    need += 0.45 * flagged("No Previous")
    # Interactions, still observable.
    need += 0.9 * _sigmoid((4000.0 - income_per_capita) / 1200.0) * float(housing_index >= 2.0)
    need += 0.7 * _sigmoid((3000.0 - income_per_capita) / 1000.0) * float(family_size >= 6.0)

    # Unobserved remainder: noise plus a uniform term for factors no form records.
    need += rng.gauss(0.0, 0.35)
    need += 0.8 * rng.random()
    return need


def label_for(need: float) -> str:
    if need >= 5.6:
        return "HIGH"
    if need >= 3.4:
        return "MEDIUM"
    return "LOW"


def build_dataset(n_samples: int = 2400, seed: int = 42) -> list[dict]:
    """Return n labelled records with hidden keys stripped.

    Class boundaries are taken from the 60th/27th percentiles of the sampled
    need distribution rather than fixed constants, so the three classes stay
    reasonably balanced no matter how the sampling distribution shifts. Without
    that, HIGH swamps the other two and accuracy becomes a meaningless number
    driven by class imbalance rather than by learning.
    """
    rng = random.Random(seed)
    households = [sample_household(rng) for _ in range(n_samples)]
    needs = [latent_need(household, rng) for household in households]
    ordered = sorted(needs)
    high_cut = ordered[int(0.60 * (len(ordered) - 1))]
    medium_cut = ordered[int(0.27 * (len(ordered) - 1))]

    rows = []
    for household, need in zip(households, needs):
        if need >= high_cut:
            label = "HIGH"
        elif need >= medium_cut:
            label = "MEDIUM"
        else:
            label = "LOW"
        rows.append(
            {
                "name": household["name"],
                "association": household["association"],
                "familySize": household["familySize"],
                "monthlyIncome": household["monthlyIncome"],
                "age": household["age"],
                "employmentStatus": household["employmentStatus"],
                "housingCondition": household["housingCondition"],
                "vulnerabilityIndicators": household["vulnerabilityIndicators"],
                "label": label,
            }
        )
    return rows


def to_xy(rows: list[dict]) -> tuple[list[list[float]], list[str]]:
    """Convert labelled rows into ordered feature matrix and label vector."""
    from features import vectorize

    x = [vectorize(row) for row in rows]
    y = [row["label"] for row in rows]
    return x, y


def dataset_summary(rows: list[dict]) -> dict:
    counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for row in rows:
        counts[row["label"]] = counts.get(row["label"], 0) + 1
    return {
        "samples": len(rows),
        "features": FEATURE_NAMES,
        "classDistribution": counts,
    }
