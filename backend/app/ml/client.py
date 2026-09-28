"""ML Microservice Client.

Dispatches predictions to the dedicated ML microservice (e.g. on Railway)
with automatic fallback to local in-process inference.
"""

import logging
from typing import Any, Dict
import httpx

from app.core.config import settings
from app.ml.model import infer_churn_probability

logger = logging.getLogger(__name__)


def predict_churn(support_tickets: int, days_since_order: int) -> Dict[str, Any]:
    """Obtain churn probability from microservice or local model fallback."""
    # Attempt remote call if configured
    service_url = settings.ML_SERVICE_URL.rstrip("/")
    if service_url and not service_url.startswith("http://localhost:8001"):
        try:
            with httpx.Client(timeout=2.0) as client:
                resp = client.post(
                    f"{service_url}/predict",
                    json={
                        "support_tickets_count": support_tickets,
                        "days_since_last_order": days_since_order,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "churn_prob": float(data["churn_prob"]),
                        "risk_level": data["risk_level"],
                        "action": data["action"],
                        "source": "railway_microservice",
                    }
        except Exception as exc:
            logger.warning(f"Remote ML inference failed ({exc}), falling back locally.")

    # Local in-process fallback
    prob = infer_churn_probability(support_tickets, days_since_order)
    risk_level = "CRITICAL" if prob >= 0.70 else "NORMAL"
    action = "RECOVER" if risk_level == "CRITICAL" else "STANDARD_SUPPORT"

    return {
        "churn_prob": prob,
        "risk_level": risk_level,
        "action": action,
        "source": "local_inference",
    }
