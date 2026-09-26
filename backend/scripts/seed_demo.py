"""Seed script for FermaAgent Supabase database.

Populates customers and orders with synthetic test data, including
the crisis demo scenario for Ivan Z. (usr_101) and Order #4501.
"""

import logging
from pathlib import Path
import sys
from typing import Any, Dict, List

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.supabase import get_supabase  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SAMPLE_CUSTOMERS: List[Dict[str, Any]] = [
    {
        "id": "usr_101",
        "name": "Ivan Z.",
        "historical_ltv": 15000.00,
        "support_tickets_count": 4,
        "days_since_last_order": 20,
        "loyalty_tier": "Tier 2",
    },
    {
        "id": "usr_102",
        "name": "Olena K.",
        "historical_ltv": 6200.00,
        "support_tickets_count": 1,
        "days_since_last_order": 5,
        "loyalty_tier": "Tier 1",
    },
    {
        "id": "usr_103",
        "name": "Taras M.",
        "historical_ltv": 24000.00,
        "support_tickets_count": 2,
        "days_since_last_order": 12,
        "loyalty_tier": "Tier 3",
    },
]

SAMPLE_INVENTORY: List[Dict[str, Any]] = [
    {
        "id": 1,
        "name": "Cossack Feast BBQ Bundle",
        "category": "BBQ",
        "retail_price": 3200.00,
        "stock": 50,
    }
]

SAMPLE_ORDERS: List[Dict[str, Any]] = [
    {
        "id": 4501,
        "customer_id": "usr_101",
        "amount": 2000.00,
        "status": "delayed_critical",
        "items": [
            {
                "name": "Artisanal Cheese & Smoked Meat Platter",
                "price": 2000.00,
                "quantity": 1,
                "perishable": True,
            }
        ],
    },
    {
        "id": 4502,
        "customer_id": "usr_102",
        "amount": 850.00,
        "status": "delivered",
        "items": [
            {
                "name": "Organic Honeycomb & Goat Cheese",
                "price": 850.00,
                "quantity": 1,
                "perishable": True,
            }
        ],
    },
    {
        "id": 4503,
        "customer_id": "usr_103",
        "amount": 4500.00,
        "status": "delayed_critical",
        "items": [
            {
                "name": "VIP Cossack Banquet",
                "price": 4500.00,
                "quantity": 1,
                "perishable": True,
            }
        ],
    },
]


def run_seed() -> None:
    """Upsert demo customers and orders into Supabase."""
    supabase = get_supabase()
    logger.info("Upserting customers...")
    for customer in SAMPLE_CUSTOMERS:
        res = supabase.table("customers").upsert(customer).execute()
        logger.info(f"Upserted customer {customer['id']}: {res.data}")

    logger.info("Upserting orders...")
    for order in SAMPLE_ORDERS:
        res = supabase.table("orders").upsert(order).execute()
        logger.info(f"Upserted order {order['id']}: {res.data}")

    logger.info("Upserting inventory...")
    for item in SAMPLE_INVENTORY:
        res = supabase.table("inventory").upsert(item).execute()
        logger.info(f"Upserted inventory {item['id']}: {res.data}")

    logger.info("Database seeding completed successfully.")


if __name__ == "__main__":
    run_seed()
