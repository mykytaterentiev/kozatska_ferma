"""Churn risk prediction tool for Google ADK Agent."""

import logging
from typing import Any, Dict
from app.core.supabase import get_supabase
from app.ml.client import predict_churn

logger = logging.getLogger(__name__)


def predict_churn_risk(user_id: str) -> Dict[str, Any]:
    """Evaluates customer churn probability using the ML Random Forest model.

    Args:
        user_id (str): The unique identifier of the customer (e.g. 'usr_101').

    Returns:
        dict: Churn probability, LTV, risk classification, and recommended action.
    """
    logger.info(
        f"[bold magenta]ML Specialist:[/bold magenta] [white]Evaluating risk profile for {user_id}[/white]"
    )
    supabase = get_supabase()

    cust_res = (
        supabase.table("customers")
        .select("historical_ltv, support_tickets_count, days_since_last_order")
        .eq("id", user_id)
        .single()
        .execute()
    )
    customer = cust_res.data or {}

    tickets = int(customer.get("support_tickets_count", 4))
    days = int(customer.get("days_since_last_order", 20))
    ltv = float(customer.get("historical_ltv", 15000.0))

    prediction = predict_churn(
        support_tickets=tickets,
        days_since_order=days,
    )

    logger.info(
        f"[bold magenta]ML Specialist:[/bold magenta] [red]Calculated Churn Probability: {
            prediction['churn_prob']:.2%} ({
            prediction['risk_level']})[/red]"
    )

    return {
        "status": "success",
        "user_id": user_id,
        "churn_prob": prediction["churn_prob"],
        "ltv": ltv,
        "risk_level": prediction["risk_level"],
        "action": prediction["action"],
        "source": prediction.get("source", "ml_engine"),
    }
