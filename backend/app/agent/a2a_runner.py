"""A2A Negotiation engine."""
import time
import uuid
import logging
import json
from typing import AsyncGenerator

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from app.agent.a2a import consumer_agent, storefront_agent
from app.core.supabase import get_supabase

logger = logging.getLogger(__name__)


async def stream_a2a_negotiation() -> AsyncGenerator[str, None]:
    """Execute a dynamic LLM vs LLM negotiation and yield real-time NDJSON chunks."""
    start_time = time.perf_counter()

    session_service = InMemorySessionService()
    consumer_session = f"consumer_{uuid.uuid4().hex[:8]}"
    storefront_session = f"storefront_{uuid.uuid4().hex[:8]}"

    await session_service.create_session(
        app_name="fermaagent", user_id="consumer_bot", session_id=consumer_session
    )
    await session_service.create_session(
        app_name="fermaagent", user_id="storefront_bot", session_id=storefront_session
    )

    consumer_runner = Runner(
        agent=consumer_agent, app_name="fermaagent", session_service=session_service
    )
    storefront_runner = Runner(
        agent=storefront_agent, app_name="fermaagent", session_service=session_service
    )

    trace_steps = []
    
    human_turn = {
        "speaker": "Ivan Z. (Human User)",
        "message": '"I am hosting a BBQ for 8 people on Saturday. Get me a premium meat and cheese platter from Kozatska Ferma. Keep it under 3,000 UAH. Deliver it to Zaporizhzhia (47.8388, 35.1396)."',
        "tools_used": []
    }
    trace_steps.append({"agent": human_turn["speaker"], "function_call": "", "action": human_turn["message"]})
    
    # Instantly yield the initial human command context
    yield json.dumps({
        "type": "turn",
        "turn": human_turn
    }) + "\n"

    current_message = "INITIATE NEGOTIATION."
    active_role = "Consumer Agent"
    final_delivery = None

    for _ in range(6):
        if active_role == "Consumer Agent":
            runner = consumer_runner
            user_id = "consumer_bot"
            session_id = consumer_session
        else:
            runner = storefront_runner
            user_id = "storefront_bot"
            session_id = storefront_session

        content = types.Content(
            role="user", parts=[types.Part.from_text(text=current_message)]
        )

        reply_text = ""
        tools_used = []

        try:
            logger.info(f"[{active_role}] Thinking...")
            async for event in runner.run_async(
                user_id=user_id, session_id=session_id, new_message=content
            ):
                if event.content and getattr(event.content, "parts", None):
                    for part in event.content.parts:
                        if getattr(part, "function_call", None):
                            tools_used.append(part.function_call.name)
                            logger.info(f"[{active_role}] Executing tool: {part.function_call.name}")

                        func_resp = getattr(part, "function_response", None)
                        if func_resp and func_resp.name == "dispatch_delivery":
                            if hasattr(func_resp.response, "items"):
                                final_delivery = dict(func_resp.response)
                                logger.info(f"[{active_role}] Tool dispatch_delivery successful: {final_delivery.get('delivery_id')}")

                if event.is_final_response() and event.content:
                    for part in event.content.parts or []:
                        if part.text:
                            reply_text += part.text
            
            logger.info(f"[{active_role}] Responded: {reply_text[:100]}...")
        except Exception as e:
            logger.error(f"Error during {active_role} turn: {e}")
            error_turn = {
                "speaker": active_role,
                "message": f"SYSTEM ERROR: {e}",
                "tools_used": tools_used,
            }
            trace_steps.append({"agent": error_turn["speaker"], "function_call": ",".join(tools_used), "action": error_turn["message"]})
            yield json.dumps({
                "type": "turn",
                "turn": error_turn
            }) + "\n"
            break

        turn_data = {
            "speaker": active_role,
            "message": reply_text,
            "tools_used": tools_used,
        }
        trace_steps.append({"agent": turn_data["speaker"], "function_call": ",".join(tools_used), "action": turn_data["message"]})
        
        # Yield the completed agent turn
        yield json.dumps({
            "type": "turn",
            "turn": turn_data
        }) + "\n"

        if "ACCEPT" in reply_text.upper() and final_delivery is not None:
            break

        if final_delivery is not None and active_role == "Storefront Agent":
            break

        current_message = reply_text
        active_role = (
            "Storefront Agent"
            if active_role == "Consumer Agent"
            else "Consumer Agent"
        )

    latency = int((time.perf_counter() - start_time) * 1000)
    
    # Save trace to Supabase
    try:
        supabase = get_supabase()
        order_id = final_delivery.get("order_id") if final_delivery else 4501
        
        trace_payload = {
            "user_id": "a2a_demo",
            "agent_response": "A2A Negotiation Concluded",
            "total_latency_ms": latency,
            "steps": trace_steps,
        }
        
        supabase.table("agent_traces").insert({
            "order_id": order_id,
            "latency_ms": latency,
            "trace_log": trace_payload,
        }).execute()
    except Exception as exc:
        logger.warning(f"Failed to persist A2A trace: {exc}")

    # Yield the final delivery data payload
    yield json.dumps({
        "type": "final",
        "delivery": final_delivery or {},
        "latency_ms": latency
    }) + "\n"
