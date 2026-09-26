"""FastAPI route handlers for chat, tracing, and demo management."""

import logging
from typing import Any, Dict
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.agent.runner import execute_agent_loop
from app.agent.a2a_runner import stream_a2a_negotiation
from app.api.schemas import ChatRequest, ChatResponse
from app.core.supabase import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["agent"])


@router.post("/a2a/simulate")
async def simulate_a2a_negotiation():
    """Run the dynamic LLM vs LLM A2A negotiation and stream the results in real-time."""
    try:
        return StreamingResponse(
            stream_a2a_negotiation(),
            media_type="application/x-ndjson"
        )
    except Exception as exc:
        logger.error(f"A2A streaming failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/health")
def health() -> Dict[str, str]:
    """Health status endpoint."""
    return {"status": "ok", "service": "fermaagent-core-backend"}


@router.post("/chat", response_model=ChatResponse)
async def chat_interaction(req: ChatRequest) -> ChatResponse:
    """Run autonomous ADK crisis resolution loop, record trace, and return reply."""
    user_id = req.user_id or "usr_101"

    try:
        reply_text, order_id, latency, trace_id = await execute_agent_loop(
            user_message=req.message,
            user_id=user_id,
        )
    except Exception as exc:
        logger.error(f"Autonomous agent turn failed: {exc}")
        raise HTTPException(
            status_code=500, detail=f"Autonomous agent turn failed: {exc}"
        )

    return ChatResponse(
        reply=reply_text,
        order_id=order_id,
        user_id=user_id,
        total_latency_ms=latency,
        trace_id=trace_id,
    )


@router.get("/traces/{user_id}")
def get_traces_for_user(user_id: str) -> Dict[str, Any]:
    """Fetch the latest agent execution trace for Admin Console visualization."""
    try:
        supabase = get_supabase()
        res = (
            supabase.table("agent_traces")
            .select("*")
            .order("id", desc=True)
            .limit(1)
            .execute()
        )

        if not res.data:
            return {
                "id": 0,
                "order_id": 4501,
                "latency_ms": 0,
                "trace_log": {
                    "user_id": user_id,
                    "total_latency_ms": 0,
                    "steps": [],
                },
            }

        return res.data[0]
    except Exception as exc:
        logger.error(f"Error reading trace from Supabase: {exc}")
        return {
            "id": 0,
            "order_id": 4501,
            "latency_ms": 0,
            "trace_log": {
                "user_id": user_id,
                "total_latency_ms": 0,
                "steps": [],
            },
        }


@router.post("/reset")
def reset_scenario() -> Dict[str, Any]:
    """Reset Order #4501 to 'delayed_critical' for repeated lecture demonstrations."""
    try:
        supabase = get_supabase()
        supabase.table("orders").update({"status": "delayed_critical"}).eq(
            "id", 4501
        ).execute()
        logger.info("Order #4501 reset to delayed_critical status")
        return {
            "status": "success",
            "message": "Order #4501 reset to delayed_critical status",
        }
    except Exception as exc:
        logger.error(f"Failed to reset scenario: {exc}")
        return {"status": "error", "message": str(exc)}
