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
2. Add your Supabase URL and publishable key. The server secret key is optional:
   authenticated reads and writes use each signed-in user's JWT with the RLS
   policies in `database/schema.sql` when no secret is configured.
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

## Vercel deployment

Deploy this repository as two Vercel projects. This keeps the React/Express
application and the Python/scikit-learn runtime independently deployable while
both remain on Vercel.

### 1. Web and API project

- Import the repository with the root directory set to `.`.
- Keep the production domain `https://barangay-assistance.vercel.app`.
- Configure these Production and Preview environment variables:

  ```env
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
  APP_ORIGINS=https://barangay-assistance.vercel.app
  ML_URL=https://your-ml-project.vercel.app
  ML_INTERNAL_TOKEN=one-long-random-shared-value
  ```

The root `vercel.json` builds Vite, preserves SPA routes, and sends `/api/*` to
the Express serverless function. `SUPABASE_SECRET_KEY` is not required for the
normal RLS-backed workflow.

### 2. ML project

- Import the same repository again as a separate Vercel project.
- Set its root directory to `ml-service`.
- Configure the same `ML_INTERNAL_TOKEN` value used by the web/API project.
- Deploy it and copy its production URL into the web/API project's `ML_URL`.
- Redeploy the web/API project after changing `ML_URL`.

The committed trained artifacts are read by the serverless scorer. Vercel has a
read-only, ephemeral application filesystem, so `/api/train` is disabled there.
Run `npm run ml:train` locally and deploy the updated artifacts when retraining
is required.

### 3. Supabase

Run the complete `database/schema.sql` in the Supabase SQL Editor before the
first production login. The publishable-key deployment depends on its RLS write
policies and pending-account trigger.

Verify the deployment with:

```text
https://barangay-assistance.vercel.app/api/health
https://barangay-assistance.vercel.app/api/ml/api/health
```

## Security notes

- Never expose `SUPABASE_SECRET_KEY` or commit `.env`.
- `SUPABASE_SECRET_KEY` is optional for normal requests, shared data, Staff
  validation, and generated-list workflows. Creating, deleting, or resetting
  another Supabase Auth login still requires that key; users can submit their
  own pending account registration without it.
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
