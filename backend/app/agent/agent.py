"""Google ADK LlmAgent definitions for FermaAgent Multi-Agent Team.

Follows official Google ADK specifications for Hierarchical Task Decomposition:
- Dedicated specialized agents for CRM, ML, and Resolution
- Root agent coordinates via AgentTool delegation
"""

from google.adk.agents.llm_agent import Agent
from google.adk.models import Gemini
from google.adk.tools.agent_tool import AgentTool

from app.core.config import settings
from app.tools.churn import predict_churn_risk
from app.tools.crm import check_crm
from app.tools.resolution import execute_resolution

# Configure model for either Vertex AI or standard AI Studio
_client_kwargs = {}
if settings.GOOGLE_CLOUD_PROJECT:
    _client_kwargs = {
        "vertexai": True,
        "project": settings.GOOGLE_CLOUD_PROJECT,
        "location": settings.GOOGLE_CLOUD_LOCATION,
    }
elif settings.GOOGLE_API_KEY:
    _client_kwargs = {"api_key": settings.GOOGLE_API_KEY}

_base_model = Gemini(model=settings.GEMINI_MODEL, client_kwargs=_client_kwargs)


# 1. Specialized CRM Agent
crm_specialist = Agent(
    model=_base_model,
    name="crm_agent",
    description="Fetches order and profile data from the customer database.",
    instruction=(
        "You are the CRM Specialist. Your only task is to fetch customer profiles "
        "and active order details using the 'check_crm' tool. "
        "Do not answer other types of questions."
    ),
    tools=[check_crm],
)

# 2. Specialized ML Churn Agent
ml_specialist = Agent(
    model=_base_model,
    name="ml_risk_agent",
    description="Predicts customer churn probability and calculates LTV risk.",
    instruction=(
        "You are the ML Risk Specialist. Your only task is to evaluate churn risk "
        "using the 'predict_churn_risk' tool. Provide the risk level and action "
        "back to the coordinator."
    ),
    tools=[predict_churn_risk],
)

# 3. Specialized Resolution Agent
resolution_specialist = Agent(
    model=_base_model,
    name="resolution_agent",
    description="Executes database refunds and generates promo codes.",
    instruction=(
        "You are the Resolution Specialist. Your only task is to execute refunds "
        "and apply promo codes using the 'execute_resolution' tool. Ensure the "
        "order ID and amounts are correct."
    ),
    tools=[execute_resolution],
)


# 4. Root Coordinator Agent (The brain)
CRISIS_SYSTEM_INSTRUCTION = """You are FermaAgent, the autonomous crisis agent
for 'Kozatska Ferma' (a premium artisanal food marketplace).
You act as a strategic coordinator managing specialized agents.

CRISIS PROTOCOL:
1. When a customer reports an issue (e.g. spoiled food, delays), immediately use
   the 'crm_agent' to inspect their active order details.
2. Next, use the 'ml_risk_agent' to evaluate their LTV and churn risk.
3. Resolution Strategy based on Risk Output:
   - CRITICAL RISK (prob >= 0.70): Use the 'resolution_agent' to immediately authorize a 100% refund and issue a 20% apology promo code (FERMA-RECOVER-20). Apologize profusely.
   - VIP STATUS (High LTV, e.g. > $20k): Use the 'resolution_agent' to authorize a 100% refund and issue a 30% VIP promo code (FERMA-VIP-30). Apologize and thank them for being a top tier customer.
   - NORMAL RISK (prob < 0.40): DO NOT authorize a full refund immediately. Do not use the 'resolution_agent'. Instead, apologize, offer a 5% discount code (FERMA-CARE-5) for the inconvenience, and explain that you must escalate the spoiled food claim to a human manager for review.
4. Synthesize all reports and produce a single empathetic response aligned with the chosen strategy.
"""

root_agent = Agent(
    model=_base_model,
    name="ferma_crisis_coordinator",
    description=(
        "Main coordinator handling customer crises and delegating to specialists."
    ),
    instruction=CRISIS_SYSTEM_INSTRUCTION,
    tools=[
        AgentTool(agent=crm_specialist),
        AgentTool(agent=ml_specialist),
        AgentTool(agent=resolution_specialist),
    ],
)
