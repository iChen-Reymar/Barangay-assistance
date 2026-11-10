# Barangay Buru-un Assistance Matching System

AI-enhanced matching system for social aid and livelihood programs in Barangay Buru-un, Iligan City. It manages association members and assistance requests, verifies eligibility data, and automatically produces explainable final prioritized household lists after Staff validation.

## Architecture

- **Web:** React, TypeScript, Vite, Tailwind CSS
- **Application API:** Node.js and Express (`http://localhost:3001`)
- **ML service:** Python, Flask, scikit-learn (`http://127.0.0.1:5050`)
- **Database and authentication:** Supabase/PostgreSQL

The Express API is the browser-facing application layer. It authenticates requests, applies role checks, communicates with Supabase using the server secret, and proxies authorized ML requests to Flask.

## Roles and workflow

1. An Association Head submits member data and requests for their association.
2. Barangay Staff verifies eligibility information and supporting evidence.
3. Staff initiates generation only after documents, qualifications, and measured household assessments are complete.
4. Decision Tree and Logistic Regression scoring is combined with explicit eligibility, duplicate-aid, cooling-period, and program rules to finalize the prioritized list.
5. Administrators monitor requests, generated lists, reports, users, and audit history without altering beneficiary rankings. Legacy approval decisions remain available as historical records.

List generation does not release money or distribute aid. Actual scheduling and distribution remain separate human administrative activities.

## Local setup

### Requirements

- Node.js 24 or a current supported LTS release
- npm
- Python 3.11+
- A Supabase project

### Configuration

1. Copy `.env.example` to `.env`.
2. Add your Supabase URL, publishable key, and server-only secret key.
3. In the Supabase SQL Editor, run `database/schema.sql`.
4. Install JavaScript dependencies:

   ```bash
   npm install
   npm --prefix server install
   ```

5. Create a Python virtual environment and install the ML dependencies:

   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r ml-service/requirements.txt
   ```

6. Start the complete development system:

   ```bash
   npm run dev
   ```

## Commands

```bash
npm run dev       # Web, API, and ML service
npm run dev:web   # Vite only
npm run dev:api   # Express only
npm run ml        # Flask only
npm run ml:train  # Train and evaluate the models
npm run account:reset -- user@example.com  # Securely reset one Supabase Auth password
npm test          # API role-isolation and ML feature/privacy regression tests
npm run build     # TypeScript and production web build
npm run lint      # ESLint
```

## Security notes

- Never expose `SUPABASE_SECRET_KEY` or commit `.env`.
- Rotate any secret copied into chat, logs, screenshots, or public documents.
- `database/schema.sql` contains role- and association-scoped RLS policies; rerun it after policy changes.
- Configure `APP_ORIGINS` to the exact deployed web origins.
- Configure the same `ML_INTERNAL_TOKEN` for Express and Flask in production.
- Back up Supabase before applying schema changes.
- Passwords live only in Supabase Auth. The schema never creates or resets passwords.
- Real names and identifiable training records must not be committed. ML datasets should use pseudonymous IDs.
- GitHub Actions runs tests, lint, the production build, and production dependency audits on every pull request.

## Data synchronization

Browser storage is an offline cache, not the authorization boundary. Changes are diffed and sent through authenticated record-level endpoints, so creating, editing, or deleting one item affects only that database record. The retired bulk-store endpoints return HTTP `410` and cannot clear shared tables.

## ML evaluation

Synthetic metrics are development results only. A real-world accuracy claim requires anonymized records with relevant vulnerability indicators and labels assigned under a documented expert rubric. Names are never model features.
