"""Core module."""

from app.core.config import settings
from app.core.supabase import get_supabase

__all__ = ["settings", "get_supabase"]
