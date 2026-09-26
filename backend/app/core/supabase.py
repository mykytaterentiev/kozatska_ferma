"""Supabase client factory and manager."""

from functools import lru_cache
from supabase import Client, create_client
from app.core.config import settings


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """Return a cached singleton Supabase client."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise ValueError("Supabase URL and Key must be set in configuration.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
