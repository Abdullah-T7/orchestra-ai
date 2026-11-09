from typing import List, Dict, Any, Tuple
from duckduckgo_search import DDGS
from app.cache import get_cached_search, set_cached_search


def search_web(query: str, max_results: int = 5) -> Tuple[List[Dict[str, Any]], bool]:
    # 1. Check Redis cache first
    cached = get_cached_search(query)
    if cached is not None and len(cached) > 0:
        return cached, True

    # 2. Live search on cache miss
    results = []
    try:
        with DDGS() as ddgs:
            raw_results = ddgs.text(query, max_results=max_results)
            for r in raw_results:
                results.append({
                    "title": r.get("title", ""),
                    "url": r.get("href", ""),
                    "snippet": r.get("body", "")
                })
        # 3. Cache the newly retrieved sources in Redis (24-hour TTL)
        if results:
            set_cached_search(query, results, ttl_seconds=86400)
    except Exception as e:
        results.append({
            "title": "Search Error",
            "url": "",
            "snippet": f"Could not perform web search: {str(e)}"
        })

    return results, False
