"""FastAPI route handlers for chat, tracing, and demo management."""

from app.agent.runner import execute_b2c_stream
import time
import logging
from typing import Any, Dict
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.agent.a2a_runner import stream_a2a_negotiation
from app.api.schemas import ChatRequest
from app.core.supabase import get_supabase
from google.genai import types
import uuid
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from app.agent.marketing import marketing_agent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["agent"])


@router.post("/marketing/chat")
async def marketing_chat_endpoint(request: ChatRequest):
    """Streaming endpoint for the internal Marketing Co-Pilot."""
    user_id = "marketing_team"
    session_id = f"mktg_session_{uuid.uuid4().hex[:8]}"

    marketing_session_service = InMemorySessionService()
    await marketing_session_service.create_session(
        app_name="fermaagent", user_id=user_id, session_id=session_id
    )

    runner = Runner(
        agent=marketing_agent,
        app_name="fermaagent",
        session_service=marketing_session_service,
    )

    async def generate_marketing_stream():
        content = types.Content(
            role="user", parts=[types.Part.from_text(text=request.message)]
        )
        logger.info(
            f"[bold magenta]Marketing User:[/bold magenta] [white]{request.message}[/white]"
        )
        logger.info(
            "[bold cyan]Marketing Co-Pilot:[/bold cyan] [italic]Thinking...[/italic]"
        )

        start_time = time.perf_counter()
        trace_steps = []
        final_reply = ""
        step_counter = 1

        try:
            async for event in runner.run_async(
                user_id=user_id, session_id=session_id, new_message=content
            ):
                if event.content and getattr(event.content, "parts", None):
                    for part in event.content.parts:
                        if getattr(part, "function_call", None):
                            tool_name = part.function_call.name
                            ui_name = tool_name.replace("_", " ").title()
                            yield f"[{ui_name}...]\n\n"

                            logger.info(
                                f"[bold cyan]Marketing Co-Pilot:[/bold cyan] [yellow]Executing tool: {tool_name}[/yellow]"
                            )

                            args = (
                                dict(part.function_call.args)
                                if getattr(part.function_call, "args", None)
                                else {}
                            )
                            trace_steps.append(
                                {
                                    "step_number": step_counter,
                                    "type": "tool_call",
                                    "tool_name": tool_name,
                                    "title": "Information Research",
                                    "status": "executed",
                                    "latency_ms": int(
                                        (time.perf_counter() - start_time) * 1000
                                    ),
                                    "summary": f"Researcher triggered {tool_name}",
                                    "input_args": args,
                                }
                            )
                            step_counter += 1

                        elif getattr(part, "function_response", None):
                            tool_name = part.function_response.name
                            logger.info(
                                f"[bold cyan]Marketing Co-Pilot:[/bold cyan] [green]Received Tool Report: {tool_name}[/green]"
                            )

                            resp_data = getattr(part.function_response, "response", {})
                            if isinstance(resp_data, dict):
                                output_data = resp_data
                            elif hasattr(resp_data, "items"):
                                output_data = dict(resp_data)
                            else:
                                output_data = {"result": str(resp_data)}

                            trace_steps.append(
                                {
                                    "step_number": step_counter,
                                    "type": "tool_response",
                                    "tool_name": tool_name,
                                    "title": "Data Acquired",
                                    "status": "completed",
                                    "latency_ms": int(
                                        (time.perf_counter() - start_time) * 1000
                                    ),
                                    "summary": f"Ingested results from {tool_name}",
                                    "output": output_data,
                                }
                            )
                            step_counter += 1

                if event.is_final_response() and event.content:
                    for part in event.content.parts or []:
                        if part.text:
                            final_reply += part.text
                            yield part.text

            logger.info(
                "[bold cyan]Marketing Co-Pilot:[/bold cyan] [dim]Finished streaming response.[/dim]"
            )

            # Persist trace
            latency = int((time.perf_counter() - start_time) * 1000)
            trace_steps.append(
                {
                    "step_number": step_counter,
                    "type": "response_generation",
                    "title": "Synthesis",
                    "status": "completed",
                    "latency_ms": latency,
                    "summary": "WriterAgent generated final response",
                    "output": {
                        "length": len(final_reply),
                        "generated_text": (
                            final_reply[:500] + "..."
                            if len(final_reply) > 500
                            else final_reply
                        ),
                    },
                }
            )

            trace_payload = {
                "user_id": user_id,
                "user_prompt": request.message,
                "agent_response": final_reply,
                "total_latency_ms": latency,
                "steps": trace_steps,
            }

            try:
                get_supabase().table("agent_traces").insert(
                    {
                        "agent_flow": "marketing",
                        "latency_ms": latency,
                        "trace_log": trace_payload,
                    }
                ).execute()
            except Exception as e:
                logger.warning(f"Failed to persist Marketing trace: {e}")

        except Exception as e:
            logger.error(f"Marketing Agent Error: {e}")
            yield f"\n[System Error]: {e}"

    return StreamingResponse(generate_marketing_stream(), media_type="text/plain")


@router.post("/a2a/simulate")
async def simulate_a2a_negotiation():
    """Run the dynamic LLM vs LLM A2A negotiation and stream the results in real-time."""
    try:
        return StreamingResponse(
            stream_a2a_negotiation(), media_type="application/x-ndjson"
        )
    except Exception as exc:
        logger.error(f"A2A streaming failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/health")
def health() -> Dict[str, str]:
    """Health status endpoint."""
    return {"status": "ok", "service": "fermaagent-core-backend"}


@router.post("/chat")
async def chat_interaction(req: ChatRequest):
    """Run autonomous ADK crisis resolution loop, stream NDJSON events."""
    user_id = req.user_id or "usr_101"
    return StreamingResponse(
        execute_b2c_stream(user_message=req.message, user_id=user_id),
        media_type="application/x-ndjson",
    )


@router.get("/traces/list")
def list_traces_for_user() -> list:
    """Fetch a history of all agent traces for the dropdown selector."""
    try:
        supabase = get_supabase()
        res = (
            supabase.table("agent_traces")
            .select("id, timestamp, order_id, agent_flow, trace_log->>user_id")
            .order("id", desc=True)
            .limit(20)
            .execute()
        )

        # Map timestamp to created_at for frontend compatibility
        traces = []
        if res.data:
            for row in res.data:
                traces.append(
                    {
                        "id": row.get("id"),
                        "order_id": row.get("order_id"),
                        "user_id": row.get("user_id", "Unknown"),
                        "agent_flow": row.get("agent_flow", "b2c"),
                        "created_at": row.get("timestamp"),
                    }
                )
        return traces
    except Exception as e:
        logger.error(f"Error fetching trace list: {e}")
        return []


@router.get("/traces/{user_id}")
def get_traces_for_user(user_id: str, trace_id: int = None) -> Dict[str, Any]:
    """Fetch the latest agent execution trace for Admin Console visualization."""
    try:
        supabase = get_supabase()
        query = supabase.table("agent_traces").select("*")

        if trace_id:
            res = query.eq("id", trace_id).execute()
        else:
            res = query.order("id", desc=True).limit(1).execute()

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

        # Clear out agent_traces to prevent trace UI bloating/corruption during
        # repeated demos
        supabase.table("agent_traces").delete().neq("id", 0).execute()

        logger.info("Order #4501 reset to delayed_critical status and traces cleared")
        return {
            "status": "success",
            "message": "Scenario reset successfully.",
        }
    except Exception as exc:
        logger.error(f"Failed to reset scenario: {exc}")
        return {"status": "error", "message": str(exc)}
