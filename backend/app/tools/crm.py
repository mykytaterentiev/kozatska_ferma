"""CRM inspection tool for Google ADK Agent."""

from typing import Any, Dict
from app.core.supabase import get_supabase


def check_crm(user_id: str) -> Dict[str, Any]:
    """Retrieves customer profile and active orders from the CRM database.

    Args:
        user_id (str): The unique identifier of the customer (e.g. 'usr_101').

    Returns:
        dict: Customer profile, order details, and historical LTV.
    """
    supabase = get_supabase()

    # Query customer profile
    cust_res = (
        supabase.table("customers")
        .select("*")
        .eq("id", user_id)
        .single()
        .execute()
    )
    customer = cust_res.data or {}

    # Query latest active or delayed order
    orders_res = (
        supabase.table("orders")
        .select("*")
        .eq("customer_id", user_id)
        .order("id", desc=True)
        .limit(1)
        .execute()
    )
    order = orders_res.data[0] if orders_res.data else {}

    return {
        "status": "success",
        "user_id": user_id,
        "customer_name": customer.get("name", "Unknown"),
        "historical_ltv": float(customer.get("historical_ltv", 0.0)),
        "support_tickets_count": int(customer.get("support_tickets_count", 0)),
        "days_since_last_order": int(customer.get("days_since_last_order", 0)),
        "order": order,
    }
