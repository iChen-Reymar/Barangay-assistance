"""Real ERPAT association roster, used as the real-data seed for training.

Source: the barangay Google Sheet roster imported into `association_members`
(40 rows: Name + Position). This is the only genuine household data the project
holds today.

IMPORTANT - what is and is not observed
----------------------------------------
The roster records a member's NAME, their POSITION in the association, and that
they belong to ERPAT. It records **nothing** about socioeconomic condition: age,
family size, income, housing and the vulnerability indicators are all blank in
the source sheet (every member is stored with age 0 and familySize 0).

Those fields are therefore *imputed* from the same barangay prior the synthetic
generator uses - they are not measurements. They are kept clearly separated here
so the training report can say exactly how much of the pool is observed.

Observed on a roster row : name, position, association
Imputed on a roster row  : familySize, monthlyIncome, age, employmentStatus,
                            housingCondition, vulnerabilityIndicators, label

As more real beneficiary records arrive (staff-entered rows carrying actual
income and family size), they replace these imputed draws row by row.
"""

from __future__ import annotations

from dataset import sample_household
import random

ASSOCIATION_NAME = "ERPAT"

# Fields the source sheet genuinely provides.
OBSERVED_FIELDS = ("name", "position", "association")

# Fields that had to be filled in because the sheet leaves them blank.
IMPUTED_FIELDS = (
    "familySize",
    "monthlyIncome",
    "age",
    "employmentStatus",
    "housingCondition",
    "vulnerabilityIndicators",
    "label",
)

# (name, position) exactly as they appear in the roster.
ERPAT_ROSTER: list[dict[str, str]] = [
    {"name": "ALFREDO V. GIGANTO", "position": "AUDITOR"},
    {"name": "BENITO C. LAPUZ, JR.", "position": "MEMBER"},
    {"name": "BIENVENIDO V. VILLAREAL, JR", "position": "MEMBER"},
    {"name": "CARLO C. ILANO", "position": "VICE PRESIDENT"},
    {"name": "CLAUDITO N. LACIDA", "position": "MEMBER"},
    {"name": "DANILO DEDICATORIA", "position": "MEMBER"},
    {"name": "EDUARDO HINOGUIN", "position": "P.I.O"},
    {"name": "EDWIN M. BERSALDO", "position": "MEMBER"},
    {"name": "ERNESTO REPASO", "position": "MEMBER"},
    {"name": "GREGORIO NATINGA, JR.", "position": "MEMBER"},
    {"name": "HENRY B. MATURAN", "position": "MEMBER"},
    {"name": "HERBERT R. SUCGANG", "position": "MEMBER"},
    {"name": "IAN ANANA", "position": "MEMBER"},
    {"name": "JAMES UMARAN", "position": "MEMBER"},
    {"name": "JED M. BRIAN", "position": "SECRETARY"},
    {"name": "JEFFREY BULABOS", "position": "MEMBER"},
    {"name": "JOHNNEL PACHASIAN", "position": "MEMBER"},
    {"name": "JOSEPHUS NACASABOG", "position": "MEMBER"},
    {"name": "KAG. LOREN ANCIS", "position": "MEMBER"},
    {"name": "KAG. SEMILITO ENDY", "position": "MEMBER"},
    {"name": "MAEL PASTRANA", "position": "MEMBER"},
    {"name": "MARCELINO ALFEREZ", "position": "MEMBER"},
    {"name": "MARK GUILLE LAS PINAS", "position": "MEMBER"},
    {"name": "MELCHOR NATINGA", "position": "MEMBER"},
    {"name": "OSCAR PROSPERO", "position": "MEMBER"},
    {"name": "PASTOR RONULFO TAGACANAO", "position": "MEMBER"},
    {"name": "RAUL S. HONDOS", "position": "MEMBER"},
    {"name": "RENANTE TARUC", "position": "MEMBER"},
    {"name": "RENEBOY CONEJERO", "position": "MEMBER"},
    {"name": "REY ESQUIRION ELNAS", "position": "MEMBER"},
    {"name": "RICO D. NACION", "position": "PRESIDENT"},
    {"name": "RIZALDE C. PEDARSE", "position": "MEMBER"},
    {"name": "RODOLFO DANDOY", "position": "MEMBER"},
    {"name": "ROGER ALICAWAY", "position": "MEMBER"},
    {"name": "ROGER C. MAGLANGIT", "position": "MEMBER"},
    {"name": "ROMEO XARANON", "position": "MEMBER"},
    {"name": "RUBEN R. CONFESOR", "position": "TREASURER"},
    {"name": "RUPERTO GILLO", "position": "MEMBER"},
    {"name": "RUPINO ENDRINA", "position": "MEMBER"},
    {"name": "VICENTE PARUIT", "position": "MEMBER"},
]


def roster_households(rng: random.Random) -> list[dict]:
    """One household draw per roster member, stamped with that member's identity.

    The socioeconomic draw is imputed (see module docstring); the identity fields
    are real. Returns full household dicts ready for `build_dataset`.
    """
    households = []
    for member in ERPAT_ROSTER:
        household = sample_household(rng)
        household["name"] = member["name"]
        household["association"] = ASSOCIATION_NAME
        household["position"] = member["position"]
        household["_observed"] = list(OBSERVED_FIELDS)
        household["_imputed"] = list(IMPUTED_FIELDS)
        households.append(household)
    return households


def roster_summary() -> dict:
    positions: dict[str, int] = {}
    for member in ERPAT_ROSTER:
        positions[member["position"]] = positions.get(member["position"], 0) + 1
    return {
        "association": ASSOCIATION_NAME,
        "members": len(ERPAT_ROSTER),
        "positions": positions,
        "observedFields": list(OBSERVED_FIELDS),
        "imputedFields": list(IMPUTED_FIELDS),
    }
