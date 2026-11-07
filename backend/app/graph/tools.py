from typing import List, Dict, Any
from duckduckgo_search import DDGS

def search_web(query: str, max_results: int = 4) -> List[Dict[str, Any]]:
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
    except Exception as e:
        results.append({
            "title": "Search Error",
            "url": "",
            "snippet": f"Could not perform web search: {str(e)}"
        })
    return results

