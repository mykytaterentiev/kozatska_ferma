"""Tools for the A2A Commerce scenario."""

from typing import Dict, Any
from app.core.supabase import get_supabase


def check_inventory(search_term: str = "") -> Dict[str, Any]:
    """Look up available inventory items. Optionally filter by a search term in name or category."""
    try:
        supabase = get_supabase()
        query = supabase.table("inventory").select("*")
        
        if search_term:
            query = query.or_(f"name.ilike.%{search_term}%,category.ilike.%{search_term}%")
            
        res = query.execute()
        return {"items": res.data}
    except Exception as e:
        return {"error": str(e)}


def check_loyalty_tier(customer_id: str) -> Dict[str, Any]:
    """Retrieve the loyalty tier for a given customer."""
    try:
        supabase = get_supabase()
        res = (
            supabase.table("customers")
            .select("loyalty_tier")
            .eq("id", customer_id)
            .execute()
        )
        if res.data:
            return {
                "customer_id": customer_id,
                "loyalty_tier": res.data[0]["loyalty_tier"],
            }
        return {"error": "Customer not found"}
    except Exception as e:
        return {"error": str(e)}


def dispatch_delivery(
    customer_id: str, bundle_name: str, final_price: float, lat: float, lon: float
) -> Dict[str, Any]:
    """Confirm the order and dispatch a delivery to the specified coordinates."""
    try:
        supabase = get_supabase()

        # 1. Create the order
        order_data = {
            "customer_id": customer_id,
            "amount": final_price,
            "status": "a2a_confirmed",
            "items": [{"name": bundle_name, "price": final_price, "quantity": 1}],
        }
        order_res = supabase.table("orders").insert(order_data).execute()
        order_id = order_res.data[0]["id"]

        # 2. Dispatch delivery
        delivery_data = {
            "order_id": order_id,
            "status": "dispatched",
            "target_lat": lat,
            "target_lon": lon,
        }
        delivery_res = (
            supabase.table("deliveries").insert(delivery_data).execute()
        )

        return {
            "status": "success",
            "order_id": order_id,
            "delivery_id": delivery_res.data[0]["id"],
            "message": f"Order for {bundle_name} dispatched to {lat}, {lon}.",
        }
    except Exception as e:
        return {"error": str(e)}
