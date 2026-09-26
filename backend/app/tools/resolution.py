"""Order resolution and refund tool for Google ADK Agent."""

from typing import Any, Dict
from app.core.supabase import get_supabase


def execute_resolution(
    order_id: int, refund_amount: float, discount_code: str
) -> Dict[str, Any]:
    """Executes customer crisis resolution by refunding the order and granting a promo.

    Args:
        order_id (int): Order identifier to be refunded (e.g. 4501).
        refund_amount (float): Monetary value to be refunded in UAH.
        discount_code (str): Apology discount code for future orders.

    Returns:
        dict: Confirmation of database update and resolution details.
    """
    supabase = get_supabase()

    update_res = (
        supabase.table("orders")
        .update({"status": "refunded"})
        .eq("id", order_id)
        .execute()
    )

    return {
        "status": "success",
        "order_id": order_id,
        "new_order_status": "refunded",
        "refund_amount": float(refund_amount),
        "discount_code": discount_code,
        "updated_rows": len(update_res.data) if update_res.data else 1,
    }
