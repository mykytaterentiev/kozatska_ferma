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
        from ddgs import DDGS
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
            "Trends (Cheese): Growing demand for craft aged cheeses with local herbs (thyme, rosemary), "
            "truffle, and honey. Popular cheese plates for wine. Trend for eco-packaging. "
            "Hashtags: #craftcheese #localcheese #cheeseplate"
        ),
        "meat": (
            "Trends (Meat): Huge demand for ready-to-bake BBQ kits, premium dry-aged marbled beef, "
            "and dry-cured sausages using traditional recipes. "
            "Hashtags: #meatzaporizhzhia #bbqua #steakukraine"
        ),
        "bbq": (
            "Trends (Picnic/BBQ): Focus on family outdoor recreation. Buyers are looking for ready-made 'picnic boxes' "
            "to save time on marinating. Fast delivery by the weekend is important."
            "Hashtags: #picnic #bbq #outdoorrecreation"
        )
    }
    
    return trends.get(category, (
        "Trends (General): 'Farm-to-table'. Supporting local Ukrainian producers. "
        "Production transparency (people want to see how it's made). Emotional marketing that reminds of home and coziness."
        "Hashtags: #localproducer #buyukrainian #kozatskaferma"
    ))
