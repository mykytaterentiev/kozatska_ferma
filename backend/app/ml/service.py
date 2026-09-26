"""Dedicated FastAPI Microservice for FermaAgent ML Inference.

Can be deployed independently on Railway, Render, or Docker.
"""

from typing import Dict
from fastapi import FastAPI
from pydantic import BaseModel, Field

from app.ml.model import infer_churn_probability, load_churn_model

ml_app = FastAPI(
    title="FermaAgent ML Churn Prediction Microservice",
    description=(
        "Dedicated microservice for real-time customer churn probability scoring"
    ),
    version="1.0.0",
)


class ChurnPredictionRequest(BaseModel):
    """Payload for ML inference."""

    support_tickets_count: int = Field(
        ge=0, le=100, description="Support ticket count"
    )
    days_since_last_order: int = Field(
        ge=0, le=365, description="Days since last order"
    )


class ChurnPredictionResponse(BaseModel):
    """Response containing prediction score and recommended operational action."""

    churn_prob: float
    risk_level: str
    action: str
    model_version: str = "RandomForest-v1.0"


@ml_app.get("/health")
def health() -> Dict[str, str]:
    """Health status endpoint."""
    return {"status": "ok", "service": "ferma-ml-microservice"}


@ml_app.get("/info")
def model_info() -> Dict[str, str]:
    """Return model specification metadata."""
    model = load_churn_model()
    return {
        "model_type": type(model).__name__,
        "n_estimators": str(model.n_estimators),
        "max_depth": str(model.max_depth),
    }


@ml_app.post("/predict", response_model=ChurnPredictionResponse)
def predict_churn(req: ChurnPredictionRequest) -> ChurnPredictionResponse:
    """Predict churn probability and determine retention action."""
    prob = infer_churn_probability(
        support_tickets=req.support_tickets_count,
        days_since_order=req.days_since_last_order,
    )

    risk_level = "CRITICAL" if prob >= 0.70 else "NORMAL"
    action = "RECOVER" if risk_level == "CRITICAL" else "STANDARD_SUPPORT"

    return ChurnPredictionResponse(
        churn_prob=prob,
        risk_level=risk_level,
        action=action,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(ml_app, host="0.0.0.0", port=8001)
