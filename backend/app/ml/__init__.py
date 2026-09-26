"""Machine learning prediction module."""

from app.ml.client import predict_churn
from app.ml.model import infer_churn_probability, load_churn_model, train_churn_model
from app.ml.service import ml_app

__all__ = [
    "predict_churn",
    "infer_churn_probability",
    "load_churn_model",
    "train_churn_model",
    "ml_app",
]
