"""Marketing Co-Pilot agent definition for Kozatska Ferma."""

from google.adk.agents import LoopAgent, LlmAgent, SequentialAgent
from google.adk.tools.tool_context import ToolContext
from app.agent.agent import _base_model
from app.tools.a2a_tools import check_inventory
from app.tools.marketing import analyze_market_trends, search_web

def complete_research(tool_context: ToolContext):
    """Call this function ONLY when sufficient information has been gathered and research is complete."""
    tool_context.actions.escalate = True
    tool_context.actions.skip_summarization = True
    return {}

# 1. Researcher: Gathers info using tools
researcher_agent = LlmAgent(
    name="ResearcherAgent",
    model=_base_model,
    instruction="""You are a researcher for the marketing department. Your task is to gather as much real-world data as possible to answer the user's request.
    
    PREVIOUS DATA:
    {{research_data}}
    
    SEARCH GUIDANCE FROM ASSESSOR:
    {{research_criticism}}
    
    TASK: 
    Use the tools `search_web`, `analyze_market_trends`, and `check_inventory` to find the necessary information.
    After using the tools, output an UPDATED and COMPLETE report with all gathered facts (merging previous data with new data). Do not invent anything, use only facts from the tools.
    """,
    tools=[search_web, analyze_market_trends, check_inventory],
    output_key="research_data"
)

# 2. Assessor: Checks if info is sufficient to break the loop
assessor_agent = LlmAgent(
    name="AssessorAgent",
    model=_base_model,
    instruction="""You are the lead analyst. Your task is to check if enough data has been gathered to fulfill the user's request.
    
    CURRENT GATHERED DATA:
    {{research_data}}
    
    IF the data is SUFFICIENT (e.g., you have fresh internet trends and inventory has been checked):
    Call the `complete_research` tool and output nothing else.
    
    ELSE (data is insufficient):
    Write a SHORT critique/guidance for the ResearcherAgent explaining exactly what else they need to find on the internet or in the database.
    """,
    tools=[complete_research],
    output_key="research_criticism"
)

# 3. The Loop Agent wrapper
research_loop = LoopAgent(
    name="ResearchLoop",
    sub_agents=[researcher_agent, assessor_agent],
    max_iterations=4
)

# 4. Final Writer: Generates the actual UI response
writer_agent = LlmAgent(
    name="WriterAgent",
    model=_base_model,
    instruction="""You are the digital Marketing Co-Pilot for the brand 'Kozatska Ferma'.
    Your Tone of Voice: a mix of authentic farming quality, local coziness, and modernity.
    
    FACTS FOR WRITING (GATHERED BY RESEARCHER):
    {{research_data}}
    
    TASK:
    Use ONLY the provided facts to write the final marketing post based on the user's request.
    
    GUIDELINES:
    - Respond exclusively in English.
    - If you create a prompt for Midjourney/DALL-E, write it in an isolated code block.
    - Structure the text beautifully with lists and paragraphs.
    """,
)

marketing_agent = SequentialAgent(
    name="marketing_copilot",
    description="Iterative research and writing pipeline using a LoopAgent.",
    sub_agents=[research_loop, writer_agent]
)

