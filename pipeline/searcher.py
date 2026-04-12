import os
from tavily import TavilyClient


client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))


def search_claim(claim: str, max_results: int = 8) -> list[dict]:
    """Search for sources related to a claim using Tavily."""
    response = client.search(
        query=claim,
        max_results=max_results,
        include_raw_content=False,
        include_answer=False,
    )

    sources = []
    for result in response.get("results", []):
        sources.append({
            "url": result.get("url", ""),
            "title": result.get("title", ""),
            "content": result.get("content", ""),
            "published_date": result.get("published_date", ""),
            "score": result.get("score", 0.0),
        })

    return sources


def extract_url_content(url: str) -> str:
    """Use Tavily to extract clean text content from a URL."""
    response = client.extract(urls=[url])
    results = response.get("results", [])
    if results:
        return results[0].get("raw_content", "")
    return ""
