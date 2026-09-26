"""Script to train and persist the ML Random Forest churn model."""

import logging
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.ml.model import infer_churn_probability, train_churn_model  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main() -> None:
    """Train Random Forest model and print test prediction."""
    logger.info("Training ML churn model on synthetic customer data...")
    train_churn_model()
    # Test Ivan Z. (usr_101) profile: 4 tickets, 20 days since last order
    prob = infer_churn_probability(support_tickets=4, days_since_order=20)
    logger.info(f"Model trained. Sample prediction (tickets=4, days=20): {prob}")


if __name__ == "__main__":
    main()
