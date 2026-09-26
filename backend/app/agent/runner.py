"""Agent execution runner, event listener, and trace persistence engine."""

import asyncio
import logging
import time
from typing import Any, Dict, List, Tuple
import uuid

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from app.agent.agent import root_agent
from app.core.config import settings
from app.core.supabase import get_supabase

logger = logging.getLogger(__name__)


def _process_tool_call(
    part: Any,
    step_counter: int,
    current_step_start: float,
    authentic_steps: List[Dict[str, Any]]
) -> int:
    """Extract tool call data into steps."""
    fc = part.function_call
    latency = int((time.perf_counter() - current_step_start) * 1000)
    args_dict = dict(fc.args) if fc.args else {}

    step_data = {
        "step_number": step_counter,
        "type": "tool_call",
        "tool_name": fc.name,
        "title": f"Agent Delegated: {fc.name}",
        "status": "completed",
        "latency_ms": latency,
        "summary": f"Coordinator delegated task to {fc.name}",
        "input_args": args_dict,
    }

    if fc.name == "ml_risk_agent":
        step_data["type"] = "ml_inference"
        step_data["highlight"] = True
        step_data["badge"] = "ML Specialist Invoked"

    authentic_steps.append(step_data)
    return step_counter + 1


def _process_tool_response(
    part: Any,
    current_step_start: float,
    authentic_steps: List[Dict[str, Any]]
) -> None:
    """Attach tool response data to the corresponding step."""
    fr = part.function_response
    for step in reversed(authentic_steps):
        if step.get("tool_name") == fr.name:
            response_data = {}
            if hasattr(fr.response, "items"):
                response_data = dict(fr.response)
            elif hasattr(fr.response, "fields"):
                response_data = {"status": "success"}

            step["output"] = response_data
            if fr.name == "ml_risk_agent":
                step["badge"] = "ML Engine Evaluated Risk"
                step["summary"] = "ML engine calculated churn probability."
            break


async def _run_with_adk_runner(
    user_message: str, user_id: str
) -> Tuple[str, List[Dict[str, Any]], int]:
    """Execute using Google ADK Runner capturing authentic tool events."""
    start_time = time.perf_counter()
    session_service = InMemorySessionService()
    session_id = f"adk_session_{uuid.uuid4().hex[:8]}"

    await session_service.create_session(
        app_name="fermaagent", user_id=user_id, session_id=session_id
    )

    runner = Runner(
        agent=root_agent,
        app_name="fermaagent",
        session_service=session_service,
    )

    content = types.Content(
        role="user", parts=[types.Part.from_text(text=user_message)]
    )

    final_text = ""
    authentic_steps = []
    step_counter = 1
    current_step_start = time.perf_counter()

    # Step 1: User Intent Parsing
    authentic_steps.append({
        "step_number": step_counter,
        "type": "intent_parsing",
        "title": "Agent Activated & Parsing Intent",
        "status": "completed",
        "latency_ms": 0,
        "summary": f"User Prompt: '{user_message[:50]}...'",
    })
    step_counter += 1
    current_step_start = time.perf_counter()

    logger.info(f"[bold magenta]User ({user_id}):[/bold magenta] [white]{user_message}[/white]")
    logger.info("[bold cyan]Coordinator:[/bold cyan] [italic]Thinking...[/italic]")
    
    async for event in runner.run_async(
        user_id=user_id, session_id=session_id, new_message=content
    ):
        if event.content and getattr(event.content, "parts", None):
            for part in event.content.parts:
                if getattr(part, "function_call", None):
                    tool_name = part.function_call.name
                    logger.info(f"[bold cyan]Coordinator:[/bold cyan] [yellow]Delegating to Specialist: {tool_name}[/yellow]")
                    step_counter = _process_tool_call(
                        part, step_counter, current_step_start, authentic_steps
                    )
                    current_step_start = time.perf_counter()
                elif getattr(part, "function_response", None):
                    tool_name = part.function_response.name
                    logger.info(f"[bold cyan]Coordinator:[/bold cyan] [green]Received Specialist Report: {tool_name}[/green]")
                    _process_tool_response(
                        part, current_step_start, authentic_steps
                    )
                    current_step_start = time.perf_counter()

        if event.is_final_response() and event.content:
            for part in event.content.parts or []:
                if part.text:
                    final_text += part.text

    total_latency = int((time.perf_counter() - start_time) * 1000)

    clean_reply = final_text.replace('\n', ' ')[:150]
    logger.info(f"[bold cyan]Coordinator:[/bold cyan] Synthesized Response in [bold]{total_latency}ms[/bold]: [dim]{clean_reply}...[/dim]")

    authentic_steps.append({
        "step_number": step_counter,
        "type": "response_generation",
        "title": "Final Response Generation",
        "status": "completed",
        "latency_ms": int((time.perf_counter() - current_step_start) * 1000),
        "summary": "Agent synthesized tools output and generated response",
    })

    if not final_text:
        raise ValueError("ADK runner finished with empty response text.")

    return final_text, authentic_steps, total_latency


def _extract_order_id(steps: List[Dict[str, Any]]) -> int:
    """Extract order ID from tool execution steps."""
    for step in steps:
        if step.get("type") == "tool_call" and "output" in step:
            out = step["output"]
            if isinstance(out, dict) and "order" in out and "id" in out["order"]:
                return int(out["order"]["id"])
            if isinstance(out, dict) and "order_id" in out:
                return int(out["order_id"])
    return 4501


def _persist_trace(
    user_id: str,
    order_id: int,
    user_message: str,
    reply: str,
    latency: int,
    steps: List[Dict[str, Any]],
) -> int:
    """Save execution trace payload to Supabase."""
    try:
        supabase = get_supabase()
        trace_payload = {
            "user_id": user_id,
            "order_id": order_id,
            "user_prompt": user_message,
            "agent_response": reply,
            "total_latency_ms": latency,
            "steps": steps,
        }
        res = (
            supabase.table("agent_traces")
            .insert(
                {
                    "order_id": order_id,
                    "latency_ms": latency,
                    "trace_log": trace_payload,
                }
            )
            .execute()
        )
        if res.data:
            return int(res.data[0].get("id", 0))
    except Exception as exc:
        logger.warning(f"Failed to persist agent trace: {exc}")
    return 0


async def execute_agent_loop(
    user_message: str, user_id: str = "usr_101"
) -> Tuple[str, int, int, int]:
    """Execute complete agent turn, record trace in Supabase, return response."""
    if not (settings.GOOGLE_API_KEY or settings.GOOGLE_CLOUD_PROJECT):
        logger.error("Neither Google API Key nor Google Cloud Project is configured.")
        raise RuntimeError("Missing authentication configuration.")

    try:
        reply, steps, latency = await _run_with_adk_runner(user_message, user_id)
    except Exception as exc:
        logger.error(f"ADK Runner exception: {exc}")
        # Build an error trace driven by the exception instead of faking success
        latency = 0
        steps = [{
            "step_number": 1,
            "type": "response_generation",
            "title": "Agent Execution Failed",
            "status": "error",
            "latency_ms": latency,
            "summary": f"System Error: {str(exc)}"
        }]
        reply = f"System Error during agent execution: {str(exc)}"

    order_id = _extract_order_id(steps)
    trace_id = _persist_trace(user_id, order_id, user_message, reply, latency, steps)

    return reply, order_id, latency, trace_id
