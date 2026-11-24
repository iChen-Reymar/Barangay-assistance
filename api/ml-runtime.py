"""Bundled Vercel Python entry point for vulnerability scoring.

The public browser API remains the authenticated Express `/api/ml/*` proxy.
Express forwards authorized requests to this same-deployment function through
the private-looking `/api/_ml-runtime/*` route.
"""

import sys
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parents[1] / "ml-service"
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app import app  # noqa: E402,F401
