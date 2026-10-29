# Vulnerability Scoring ML Service

Python service that implements the Machine Learning Vulnerability Scoring Module:
two supervised classifiers, a **Decision Tree** and **Logistic Regression**, which
score how vulnerable a barangay household is. A rule-based module then matches
that score to an assistance program.

Both algorithms were chosen because they are interpretable. A barangay official
has to be able to explain to a resident why they were or were not recommended for
aid, so the service returns the reasoning alongside every score rather than just
a number.

## Running it

```bash
pip install -r requirements.txt
python app.py          # or: npm run ml  (from the repo root)
```

It listens on `http://localhost:5050` (override with `ML_PORT`). The React app
talks to it through `src/services/mlService.ts`, which sets `VITE_ML_URL` if you
run it somewhere else.

**The service is optional.** If it is not running, the app falls back to a local
rule-based scorer and labels those rows "Local Rules" in the UI so the two can
never be confused. Staff can always generate an assistance list.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness, feature list, class order, ensemble weights |
| `GET` | `/api/model` | Held-out metrics, confusion matrix, tree rules, coefficients, feature importances |
| `POST` | `/api/train` | Retrain on the synthetic seed plus any real records |
| `POST` | `/api/score` | Score raw beneficiary records |

### Scoring

```bash
curl -X POST http://localhost:5050/api/score \
  -H "Content-Type: application/json" \
  -d '{"records":[{"id":"1","name":"Juan dela Cruz","familySize":8,"monthlyIncome":3500,
       "age":58,"employmentStatus":"Seasonal Worker","housingCondition":"Makeshift / Salvaged",
       "vulnerabilityIndicators":["Elderly Member (60+)","Children Under 5 Years Old"]}]}'
```

Each result carries the blended score, the predicted class, both models' separate
predictions, the decision tree's rule path, logistic regression's per-feature
contributions, and whether the two models agreed.

### Retraining on real data

```bash
curl -X POST http://localhost:5050/api/train \
  -H "Content-Type: application/json" \
  -d '{"records":[ ...verified beneficiary records with a "vulnerability" label... ]}'
```

Real records are appended to the synthetic pool using their stored
`vulnerability` value as the label, so the models keep learning from actual
barangay data as it accumulates. The staff UI exposes this as **Retrain Models**
on the ML Model Performance page.

## How it works

**Features** (`features.py`) — 12 numeric features built from the beneficiary
record: family size, monthly income, income per member, head's age, employment
and housing ordinals, the five vulnerability indicators, and a dependent-load
count. Training and inference share this one encoder so they cannot drift apart.

Sex is deliberately excluded from the features. Scoring a household's need for aid
on the applicant's sex would embed a demographic bias into an allocation decision,
which is the opposite of what this system exists to do. It stays on the record for
administrative use only.

**Training data** (`dataset.py`) — the beneficiary store starts empty, so the
models are seeded with 2400 synthetic barangay households. Labels come from a
latent need function built mostly from *observed* fields plus a smaller unobserved
remainder standing in for what no intake form captures: debt burden, chronic
illness, a child who dropped out of school. That remainder is what keeps the task
genuinely non-trivial — the models cannot reach a perfect score, so the reported
accuracy is an honest measurement rather than a lookup table in disguise.

Class boundaries are taken from percentiles of the need distribution rather than
fixed constants, so the three classes stay balanced.

**Models** (`models.py`) — a decision tree (`max_depth=6`, `min_samples_leaf=12`)
and a standardised multinomial logistic regression, each with `class_weight="balanced"`
so the minority class is not ignored. Their class probabilities are blended 50/50
and converted to a 0-100 score as the expected value across the three classes, so
a borderline household lands between bands instead of snapping to a boundary.

If the two models disagree, the more vulnerable reading is used. That is the safer
direction for a household that needs aid, and the disagreement is surfaced in the
UI rather than hidden.

**Accuracy** — measured on a held-out 25% test split, stratified by class. As of
the last training run:

| Model | Accuracy |
| --- | --- |
| Decision Tree | 80.7% |
| Logistic Regression | 85.3% |
| Blended (what the system reports) | **86.0%** |

The study's target is a minimum of 80% classification accuracy.

## Files

| File | Role |
| --- | --- |
| `features.py` | Feature schema and the raw-record encoder |
| `dataset.py` | Synthetic household generator and labelling |
| `models.py` | Both classifiers, blending, and the explanation builders |
| `train.py` | Training/evaluation entry point, also importable |
| `app.py` | Flask API, model persistence via joblib |
| `artifacts/` | Saved model and metrics (gitignored — regenerated on first run) |
