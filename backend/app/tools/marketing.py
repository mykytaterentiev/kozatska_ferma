"""Marketing-specific tools for the Marketing Co-Pilot agent."""
import logging

logger = logging.getLogger(__name__)

def search_web(query: str) -> str:
    """Searches the live internet for information. 
    
    Use this tool to find real-world news, competitor campaigns, recipes, or global marketing trends.
    Formulate precise search queries. If the results are poor, you should adjust the query and search again.
    
    Args:
        query (str): The search query to look up on the internet.
        
    Returns:
        str: A JSON-like string containing the top search results (title, snippet, URL).
    """
    logger.info(f"[bold magenta]🌍 Web Search:[/bold magenta] [dim]Querying: '{query}'[/dim]")
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=4))
        
        if not results:
            return "No results found. Try adjusting your search query."
            
        formatted_results = []
        for r in results:
            formatted_results.append(f"Title: {r.get('title')}\nSnippet: {r.get('body')}\nSource: {r.get('href')}\n")
        
        return "\n---\n".join(formatted_results)
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return f"Search failed due to an error: {str(e)}"

def analyze_market_trends(category: str) -> str:
    """Searches for current local food, culinary, and marketing trends in Zaporizhzhia and Ukraine.
    
    Args:
        category (str): The product category to research (e.g., 'cheese', 'meat', 'bbq', 'general').
        
    Returns:
        str: A summary of current market trends, popular hashtags, and consumer interests.
    """
    category = category.lower()
    
    trends = {
        "cheese": (
            "Тренди (Сир): Зростає попит на крафтові витримані сири з локальними травами (чебрець, розмарин), "
            "трюфелем та медом. Популярні сирні тарілки для вина. Тренд на еко-пакування. "
            "Хештеги: #крафтовийсир #українськийсир #сирнанарізка"
        ),
        "meat": (
            "Тренди (М'ясо): Шалений попит на готові до запікання BBQ-набори, преміальну мармурову яловичину "
            "сухої витримки та сиров'ялені ковбаси за старовинними рецептами. "
            "Хештеги: #м'ясозапоріжжя #bbqua #стейкукраїна"
        ),
        "bbq": (
            "Тренди (Пікнік/BBQ): Фокус на сімейний відпочинок на природі. Покупці шукають готові 'бокси для пікніка', "
            "щоб не витрачати час на маринування. Важлива швидка доставка до вихідних."
            "Хештеги: #пікнік #шашлик #відпочинокнаприроді"
        )
    }
    
    return trends.get(category, (
        "Тренди (Загальні): 'Farm-to-table' (з ферми на стіл). Підтримка локальних українських виробників. "
        "Прозорість виробництва (люди хочуть бачити, як це робиться). Емоційний маркетинг, що нагадує про дім та затишок."
        "Хештеги: #локальнийвиробник #купуйукраїнське #козацькаферма"
    ))
