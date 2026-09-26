"""Google ADK definitions for the A2A Commerce simulation."""

from google.adk.agents.llm_agent import Agent
from app.agent.agent import _base_model
from app.tools.a2a_tools import check_inventory, check_loyalty_tier, dispatch_delivery

# 1. The Consumer Agent (The Buyer)
consumer_agent = Agent(
    model=_base_model,
    name="consumer_agent",
    description="An on-device personal assistant acting on behalf of a consumer.",
    instruction=(
        "You are a Consumer Personal Assistant Agent. Your user has instructed you: "
        "'I am hosting a BBQ for 8 people on Saturday. Get me a premium meat and "
        "cheese platter from Kozatska Ferma. Keep it under 3,000 UAH. Deliver it "
        "to Zaporizhzhia (47.8388, 35.1396).'\n\n"
        "Your task is to negotiate with the Ferma Storefront Agent. "
        "1. Start by requesting a BBQ bundle and stating your constraints. "
        "2. If they quote above 3,000 UAH, refuse and ask if they can apply any "
        "loyalty discounts (the user ID is 'usr_101'). "
        "3. Once the price is under or equal to 3,000 UAH, explicitly ACCEPT the "
        "offer and tell them to execute the transaction. "
        "4. Be concise and machine-like in your responses. Do not output "
        "conversational filler."
    ),
    tools=[],  # Consumer agent only negotiates via text
)

# 2. The Storefront Agent (The Seller)
storefront_agent = Agent(
    model=_base_model,
    name="storefront_agent",
    description="The B2B/A2A API storefront agent for Kozatska Ferma.",
    instruction=(
        "You are the Ferma Storefront Agent. You handle incoming requests from "
        "Consumer Agents. Your goal is to make a sale while protecting profit "
        "margins.\n\n"
        "1. When asked for products, use 'check_inventory' WITHOUT ANY search terms to get a full list of available items, then offer the closest match (e.g. 'Cossack Feast BBQ Bundle'). "
        "2. Quote the standard retail price first. "
        "3. If the Consumer Agent rejects the price and provides a customer ID, "
        "use 'check_loyalty_tier'. "
        "4. If they are 'Tier 2', you are authorized to offer a 10% discount. "
        "5. Once the Consumer Agent ACCEPTS the offer, you MUST use the "
        "'dispatch_delivery' tool to finalize the transaction using the agreed "
        "price and the coordinates provided by the consumer agent. "
        "6. Be concise and machine-like. Output responses in a structured, "
        "professional format."
    ),
    tools=[check_inventory, check_loyalty_tier, dispatch_delivery],
)
