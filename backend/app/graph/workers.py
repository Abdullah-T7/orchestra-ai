import os
from datetime import datetime
from app.graph.state import MissionState
from app.graph.tools import search_web

def _get_timestamp() -> str:
    return datetime.now().strftime("%H:%M:%S")

def researcher_node(state: MissionState) -> dict:
    objective = state["objective"]
    query = f"{objective} market competitors pain points"
    results = search_web(query, max_results=4)

    log_entry = {
        "agent": "Researcher Agent",
        "message": f"Searched web for '{query}' and retrieved {len(results)} sources.",
        "timestamp": _get_timestamp()
    }

    return {
        "current_agent": "researcher",
        "research_data": results,
        "logs": state.get("logs", []) + [log_entry]
    }

def analyst_node(state: MissionState) -> dict:
    research = state.get("research_data", [])
    objective = state["objective"]
    api_key = os.getenv("GEMINI_API_KEY")

    if api_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
            prompt = f"Analyze these search results for objective '{objective}':\n\n{research}"
            response = llm.invoke(prompt)
            analysis_text = str(response.content)
        except Exception as e:
            analysis_text = f"LLM analysis failed: {str(e)}"
    else:
        snippets = "\n- ".join([f"{r.get('title', 'Source')}: {r.get('snippet', '')}" for r in research])
        analysis_text = (
            f"### Market Analysis & Competitor Landscape\n\n"
            f"**Key Findings from Live Sources:**\n- {snippets}\n\n"
            f"**Identified Gaps & Opportunities:**\n"
            f"- High subscription pricing and complex onboarding in current products.\n"
            f"- Need for simplified, lightweight tools targeting small operators."
        )

    log_entry = {
        "agent": "Analyst Agent",
        "message": "Synthesized competitor landscape and market opportunities.",
        "timestamp": _get_timestamp()
    }

    return {
        "current_agent": "analyst",
        "analysis": analysis_text,
        "logs": state.get("logs", []) + [log_entry]
    }

def writer_node(state: MissionState) -> dict:
    objective = state["objective"]
    analysis = state.get("analysis", "No analysis provided.")
    sources = state.get("research_data", [])

    sources_text = "\n".join([f"- [{s.get('title', 'Source')}]({s.get('url', '#')})" for s in sources if s.get("url")])

    final_report = f"""# Strategic Execution Plan: {objective}

## 1. Executive Summary
This report provides market research, competitor analysis, and a go-to-market strategy for: **{objective}**.

## 2. Market & Competitor Analysis
{analysis}

## 3. Go-To-Market Recommendations
1. **MVP Scope:** Address the primary friction points found in competitor research.
2. **Pricing Model:** Transparent, flat-tier pricing to compete against high-cost incumbents.
3. **Distribution Channels:** Targeted niche communities, direct outreach, and search-optimized content.

## 4. Cited Sources
{sources_text if sources_text else "Primary internet search index."}
"""

    log_entry = {
        "agent": "Writer Agent",
        "message": "Compiled final strategic report with citations.",
        "timestamp": _get_timestamp()
    }

    return {
        "current_agent": "writer",
        "final_report": final_report,
        "status": "completed",
        "logs": state.get("logs", []) + [log_entry]
    }


