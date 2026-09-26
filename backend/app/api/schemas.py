"""Pydantic schemas for FermaAgent API."""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Payload for user chat input."""

    message: str = Field(..., min_length=1, description="Customer message text")
    user_id: Optional[str] = Field("usr_101", description="Hardcoded demo user ID")


class ChatResponse(BaseModel):
    """Payload for agent chat resolution response."""

    reply: str
    order_id: int
    user_id: str
    total_latency_ms: int
    trace_id: Optional[int] = None


class A2ATurn(BaseModel):
    """A single turn in the A2A negotiation."""
    speaker: str
    message: str
    tools_used: List[str] = []


class A2ASimulateResponse(BaseModel):
    """Response containing the complete A2A negotiation log."""
    status: str
    turns: List[A2ATurn]
    final_delivery: Optional[Dict[str, Any]] = None
    total_latency_ms: int
