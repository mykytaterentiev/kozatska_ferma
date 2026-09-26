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
    instruction="""Ви — дослідник для маркетингового відділу. Ваше завдання — зібрати максимум реальних даних для відповіді на запит користувача.
    
    ПОПЕРЕДНІ ДАНІ:
    {{research_data}}
    
    ВКАЗІВКИ ЩОДО ПОШУКУ ВІД АНАЛІТИКА:
    {{research_criticism}}
    
    ЗАВДАННЯ: 
    Використовуйте інструменти `search_web`, `analyze_market_trends` та `check_inventory`, щоб знайти потрібну інформацію.
    Після використання інструментів, виведіть ОНОВЛЕНИЙ і ПОВНИЙ звіт з усіма зібраними фактами (об'єднавши попередні дані з новими). Нічого не вигадуйте, тільки факти з інструментів.
    """,
    tools=[search_web, analyze_market_trends, check_inventory],
    output_key="research_data"
)

# 2. Assessor: Checks if info is sufficient to break the loop
assessor_agent = LlmAgent(
    name="AssessorAgent",
    model=_base_model,
    instruction="""Ви — головний аналітик. Ваше завдання перевірити, чи зібрано достатньо даних для виконання запиту користувача.
    
    ПОТОЧНІ ЗІБРАНІ ДАНІ:
    {{research_data}}
    
    IF дані ДОСТАТНІ (наприклад: є свіжі тренди з інтернету, перевірено наявність товару):
    Викличте інструмент `complete_research` і більше нічого не пишіть.
    
    ELSE (даних недостатньо):
    Напишіть КОРОТКУ вказівку (critique) для ResearcherAgent, що саме йому треба ще знайти в інтернеті або в базі даних.
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
    instruction="""Ви — цифровий Marketing Co-Pilot для ТМ «Козацька ферма».
    Ваш Tone of Voice: поєднання української автентичності, фермерської якості, локальної затишності та сучасності.
    
    ФАКТИ ДЛЯ НАПИСАННЯ (ЗІБРАНІ ДОСЛІДНИКОМ):
    {{research_data}}
    
    ЗАВДАННЯ:
    Використовуйте ВИКЛЮЧНО надані факти для написання фінального тексту відповідно до запиту користувача.
    
    ВКАЗІВКИ:
    - Відповідайте виключно українською мовою.
    - Якщо ви створюєте промпт для Midjourney/DALL-E, напишіть його АНГЛІЙСЬКОЮ мовою в окремому блоці коду.
    - Структуруйте текст (списки, абзаци).
    """,
)

marketing_agent = SequentialAgent(
    name="marketing_copilot",
    description="Iterative research and writing pipeline using a LoopAgent.",
    sub_agents=[research_loop, writer_agent]
)

