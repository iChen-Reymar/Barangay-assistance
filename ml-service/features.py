"""Feature schema shared by the synthetic generator, the trainer and the API.

The client (React/TypeScript) sends a raw beneficiary record. Every conversion
from that raw record into a numeric model vector happens here so that training
and inference can never drift apart.
"""

from __future__ import annotations

# Raw fields accepted from the client. These mirror the StaffBeneficiary
# interface in src/data/staffMockData.ts.
INPUT_FIELDS = {
    "familySize",
    "monthlyIncome",
    "workingHouseholdMembers",
    "age",
    "employmentStatus",
    "housingCondition",
    "vulnerabilityIndicators",
}

# The five checkboxes offered on the Add Beneficiary form. The exact strings
# matter: the client posts them verbatim.
INDICATOR_ELDERLY = "Elderly Member (60+)"
INDICATOR_PWD = "PWD Member (Person with Disability)"
INDICATOR_YOUNG_CHILDREN = "Children Under 5 Years Old"
INDICATOR_UNEMPLOYED_ADULTS = "Unemployed Adult Members"
INDICATOR_NO_PRIOR_AID = "No Previous Government Assistance Received"

INDICATORS = [
    INDICATOR_ELDERLY,
    INDICATOR_PWD,
    INDICATOR_YOUNG_CHILDREN,
    INDICATOR_UNEMPLOYED_ADULTS,
    INDICATOR_NO_PRIOR_AID,
]

# Final ordered feature vector handed to scikit-learn.
FEATURE_NAMES = [
    "family_size",
    "monthly_income",
    "income_per_capita",
    "working_household_members",
    "income_per_worker",
    "head_age",
    "employment_employed",
    "employment_self_employed",
    "employment_seasonal_worker",
    "employment_unemployed",
    "housing_concrete",
    "housing_light_materials",
    "housing_temporary",
    "housing_makeshift_salvaged",
    "has_elderly",
    "has_pwd",
    "has_young_children",
    "has_unemployed_adults",
    "no_prior_aid",
    "dependent_load",
]

# NOTE: sex is deliberately NOT a model feature. Scoring a household's need for
# aid on the basis of the applicant's sex would embed a demographic bias into an
# allocation decision, which cuts against the fairness goal this system exists to
# serve. It stays on the record for administrative use only.


def _num(value, default: float = 0.0) -> float:
    try:
        result = float(value)
    except (TypeError, ValueError):
        return default
    if result != result or result in (float("inf"), float("-inf")):
        return default
    return result


def _indicator_flags(raw_indicators) -> dict[str, float]:
    if not isinstance(raw_indicators, (list, tuple, set)):
        raw_indicators = []
    present = {str(item).strip().lower() for item in raw_indicators}
    return {
        "has_elderly": 1.0 if INDICATOR_ELDERLY.lower() in present else 0.0,
        "has_pwd": 1.0 if INDICATOR_PWD.lower() in present else 0.0,
        "has_young_children": 1.0 if INDICATOR_YOUNG_CHILDREN.lower() in present else 0.0,
        "has_unemployed_adults": 1.0 if INDICATOR_UNEMPLOYED_ADULTS.lower() in present else 0.0,
        "no_prior_aid": 1.0 if INDICATOR_NO_PRIOR_AID.lower() in present else 0.0,
    }


def encode(record: dict) -> dict[str, float]:
    """Turn one raw beneficiary record into the named model feature dict."""
    family_size = max(1.0, _num(record.get("familySize"), 1.0))
    monthly_income = max(0.0, _num(record.get("monthlyIncome"), 0.0))
    working_members = max(0.0, min(family_size, _num(record.get("workingHouseholdMembers"), 0.0)))

    housing_raw = str(record.get("housingCondition") or "").strip().lower()
    employment_raw = str(record.get("employmentStatus") or "").strip().lower()

    flags = _indicator_flags(record.get("vulnerabilityIndicators"))
    dependent_load = flags["has_elderly"] + flags["has_pwd"] + flags["has_young_children"]

    employment_flags = {
        "employment_employed": 1.0 if employment_raw == "employed" else 0.0,
        "employment_self_employed": 1.0 if employment_raw == "self-employed" else 0.0,
        "employment_seasonal_worker": 1.0 if employment_raw == "seasonal worker" else 0.0,
        "employment_unemployed": 1.0 if employment_raw == "unemployed" else 0.0,
    }
    housing_flags = {
        "housing_concrete": 1.0 if housing_raw == "concrete" else 0.0,
        "housing_light_materials": 1.0 if housing_raw == "light materials" else 0.0,
        # Keep legacy "Temporary" records compatible with the trained feature
        # while new forms use the clearer "Renter" label.
        "housing_temporary": 1.0 if housing_raw in {"renter", "temporary", "temporary/salvaged"} else 0.0,
        "housing_makeshift_salvaged": 1.0 if housing_raw == "makeshift / salvaged" else 0.0,
    }

    return {
        "family_size": family_size,
        "monthly_income": monthly_income,
        "income_per_capita": monthly_income / family_size,
        "working_household_members": working_members,
        "income_per_worker": monthly_income / max(1.0, working_members),
        "head_age": _num(record.get("age"), 40.0),
        **employment_flags,
        **housing_flags,
        **flags,
        "dependent_load": dependent_load,
    }


def vectorize(record: dict) -> list[float]:
    """Encode a record and return the ordered numeric vector."""
    encoded = encode(record)
    return [encoded[name] for name in FEATURE_NAMES]


def human_readable(record: dict) -> list[str]:
    """List the raw record's fields that matter, for display next to a score."""
    encoded = encode(record)
    parts = [
        f"family of {encoded['family_size']:.0f}",
        f"₱{encoded['monthly_income']:,.0f}/month",
        f"₱{encoded['income_per_capita']:,.0f} per member",
        f"{encoded['working_household_members']:.0f} working household members",
    ]
    if encoded["has_elderly"]:
        parts.append("elderly member")
    if encoded["has_pwd"]:
        parts.append("PWD member")
    if encoded["has_young_children"]:
        parts.append("child under 5")
    if encoded["has_unemployed_adults"]:
        parts.append("unemployed adults")
    if encoded["no_prior_aid"]:
        parts.append("no prior assistance")
    if encoded["housing_temporary"] or encoded["housing_makeshift_salvaged"]:
        parts.append("rented or substandard housing")
    return parts
