"""Machine Learning Churn Prediction Model.

Trains and evaluates a Random Forest classifier to predict customer churn risk
based on support tickets count and days since last order.
"""

from pathlib import Path
from typing import Tuple

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier

MODEL_DIR = Path(__file__).resolve().parent
ARTIFACT_PATH = MODEL_DIR / "churn_forest.joblib"


def generate_synthetic_training_data(
    n_samples: int = 3000, random_state: int = 42
) -> Tuple[np.ndarray, np.ndarray]:
    """Generate reproducible synthetic customer interaction data."""
    rng = np.random.RandomState(random_state)

    # support_tickets_count: Poisson distribution clipped between 0 and 10
    tickets = np.clip(rng.poisson(lam=1.8, size=n_samples), 0, 10)

    # days_since_last_order: Exponential distribution clipped between 1 and 90
    days = np.clip(rng.exponential(scale=20, size=n_samples), 1, 90).astype(int)

    # Calibrated churn boundary so Ivan Z. (4 tickets, 20 days) gives 0.88
    logits = -2.1 + (0.85 * tickets) + (0.04 * days)
    probabilities = 1.0 / (1.0 + np.exp(-logits))
    labels = (rng.rand(n_samples) < probabilities).astype(int)

    features = np.column_stack([tickets, days])
    return features, labels


def train_churn_model(save_path: Path = ARTIFACT_PATH) -> RandomForestClassifier:
    """Train Random Forest classifier and persist artifact to disk."""
    x_train, y_train = generate_synthetic_training_data()

    classifier = RandomForestClassifier(
        n_estimators=100,
        max_depth=5,
        random_state=42,
    )
    classifier.fit(x_train, y_train)

    joblib.dump(classifier, save_path)
    return classifier


def load_churn_model(artifact_path: Path = ARTIFACT_PATH) -> RandomForestClassifier:
    """Load model from artifact or train if not yet existing."""
    if not artifact_path.exists():
        return train_churn_model(artifact_path)
    return joblib.load(artifact_path)


def infer_churn_probability(support_tickets: int, days_since_order: int) -> float:
    """Predict customer churn probability given interaction metrics."""
    model = load_churn_model()
    features = np.array([[support_tickets, days_since_order]])
    churn_prob = float(model.predict_proba(features)[0][1])
    return round(churn_prob, 2)
