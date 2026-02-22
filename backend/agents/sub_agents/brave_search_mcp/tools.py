"""
Web search tools for the market research agent.
Uses SerpAPI (Google Search + Google News) with SERPAPI_API_KEY.
"""

import logging
import os

logger = logging.getLogger("web_search_tools")

# SerpAPI key from environment (required for search)
def _get_serpapi_key() -> str | None:
    return os.environ.get("SERPAPI_API_KEY")


def web_search(query: str, max_results: int = 8) -> str:
    """
    Search the web using SerpAPI (Google) for real-time market, competitor, and investor data.

    Use this tool when you need up-to-date information about:
    - Market size, TAM, industry trends
    - Competitors and their funding/positioning
    - Investor activity and recent deals
    - Analogous startups and their growth

    Args:
        query: The search query string (be specific for better results).
        max_results: Number of results to return (default 8, max 20).

    Returns:
        Formatted search results with title, URL, and snippet for each result.
    """
    api_key = _get_serpapi_key()
    if not api_key:
        return (
            "Web search is unavailable: SERPAPI_API_KEY is not set. "
            "Add SERPAPI_API_KEY to your environment (e.g. .env) with your SerpAPI key."
        )

    try:
        from serpapi import GoogleSearch
    except ImportError:
        return (
            "Web search is unavailable: 'google-search-results' package is not installed. "
            "Run: pip install google-search-results"
        )

    max_results = min(max_results, 20)
    try:
        search = GoogleSearch({
            "q": query,
            "api_key": api_key,
            "num": max_results,
        })
        data = search.get_dict()

        results = data.get("organic_results") or []
        if not results:
            return f"No results found for: {query}"

        lines = [f"## Web Search Results: {query}\n"]
        for i, r in enumerate(results[:max_results], 1):
            title = r.get("title", "No title")
            link = r.get("link", "")
            snippet = (r.get("snippet") or "").strip()
            lines.append(f"**{i}. {title}**")
            if link:
                lines.append(f"   URL: {link}")
            if snippet:
                lines.append(f"   {snippet}")
            lines.append("")

        return "\n".join(lines)

    except Exception as e:
        logger.warning(f"Web search failed for query '%s': %s", query, e)
        return f"Search failed: {str(e)}. Try rephrasing the query."


def web_search_news(query: str, max_results: int = 6) -> str:
    """
    Search recent news using SerpAPI (Google News) for the latest startup/investment/market news.

    Use for:
    - Recent funding rounds in a sector
    - Breaking industry news
    - Latest competitor announcements

    Args:
        query: News search query.
        max_results: Number of news articles to return (default 6).

    Returns:
        Recent news articles with title, URL, date, and summary.
    """
    api_key = _get_serpapi_key()
    if not api_key:
        return (
            "News search is unavailable: SERPAPI_API_KEY is not set. "
            "Add SERPAPI_API_KEY to your environment."
        )

    try:
        from serpapi import GoogleSearch
    except ImportError:
        return "News search unavailable: install google-search-results (pip install google-search-results)"

    max_results = min(max_results, 10)
    try:
        search = GoogleSearch({
            "q": query,
            "engine": "google_news",
            "api_key": api_key,
            "num": max_results,
        })
        data = search.get_dict()

        results = data.get("news_results") or []
        if not results:
            return f"No recent news found for: {query}"

        lines = [f"## Recent News: {query}\n"]
        for i, r in enumerate(results[:max_results], 1):
            title = r.get("title", "No title")
            link = r.get("link", "")
            snippet = (r.get("snippet") or "").strip()
            date = r.get("date", "")
            source = r.get("source", "")
            lines.append(f"**{i}. {title}**")
            if source and date:
                lines.append(f"   {source} — {date}")
            elif date:
                lines.append(f"   {date}")
            if link:
                lines.append(f"   URL: {link}")
            if snippet:
                lines.append(f"   {snippet}")
            lines.append("")

        return "\n".join(lines)

    except Exception as e:
        logger.warning(f"News search failed for query '%s': %s", query, e)
        return f"News search failed: {str(e)}"
