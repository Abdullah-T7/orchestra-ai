import os
from datetime import datetime
from app.graph.state import MissionState
from app.graph.tools import search_web


def _get_timestamp() -> str:
    return datetime.now().strftime("%H:%M:%S")


def _get_llm():
    from langchain_ollama import ChatOllama
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    return ChatOllama(model="llama3.2", base_url=base_url, timeout=120)


def researcher_node(state: MissionState) -> dict:
    objective = state["objective"]
    query = f"{objective} market competitors pricing customer complaints"
    results = search_web(query, max_results=6)

    log_entry = {
        "agent": "Researcher Agent",
        "message": f"Searched web for '{query}' — retrieved {len(results)} live sources.",
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

    snippets_text = "\n\n".join([
        f"Source: {r.get('title', 'Unknown')}\nURL: {r.get('url', '')}\nSummary: {r.get('snippet', '')}"
        for r in research
    ])

    prompt = f"""You are a senior market analyst. A research team collected the following live web sources for this objective:

OBJECTIVE: {objective}

RESEARCH SOURCES:
{snippets_text}

Based on these sources, write a detailed market analysis that includes:
1. Competitor overview (names, pricing tiers if visible, key features)
2. Common customer complaints and unmet needs
3. SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)
4. Key market gaps and strategic opportunities

Format your response as clean markdown with proper headers."""

    try:
        llm = _get_llm()
        response = llm.invoke(prompt)
        analysis_text = str(response.content)
    except Exception as e:
        analysis_text = f"Ollama analysis failed: {str(e)}\n\nRaw sources collected:\n{snippets_text}"

    log_entry = {
        "agent": "Analyst Agent",
        "message": "Completed SWOT analysis and competitor landscape via Ollama.",
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

    sources_text = "\n".join([
        f"- [{s.get('title', 'Source')}]({s.get('url', '#')})"
        for s in sources if s.get("url")
    ])

    prompt = f"""You are a senior startup strategist and technical writer. Using the market analysis below, write a complete go-to-market launch document for this objective:

OBJECTIVE: {objective}

MARKET ANALYSIS:
{analysis}

Write a professional strategic document that includes:
1. Executive Summary (2-3 sentences)
2. MVP Feature List (10 concrete features with brief descriptions)
3. Pricing Strategy (3 tiers with names and prices)
4. Launch Plan (phased: Month 1, Month 2-3, Month 4-6)
5. Key Risks and Mitigations

Format as polished markdown. Be specific — use real numbers, real timelines."""

    try:
        llm = _get_llm()
        response = llm.invoke(prompt)
        report_body = str(response.content)
    except Exception as e:
        report_body = f"Writer LLM failed: {str(e)}\n\nAnalysis:\n{analysis}"

    final_report = f"""# Strategic Execution Plan: {objective}

{report_body}

---

## Cited Sources
{sources_text if sources_text else "Live internet search index."}
"""

    log_entry = {
        "agent": "Writer Agent",
        "message": "Compiled full strategic launch plan with MVP list and go-to-market roadmap.",
        "timestamp": _get_timestamp()
    }

    return {
        "current_agent": "writer",
        "final_report": final_report,
        "status": "completed",
        "logs": state.get("logs", []) + [log_entry]
    }
