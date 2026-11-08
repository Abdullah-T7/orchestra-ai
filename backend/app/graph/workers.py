import os
from datetime import datetime
from app.graph.state import MissionState
from app.graph.tools import search_web


def _get_timestamp() -> str:
    return datetime.now().strftime("%H:%M:%S")


def _get_llm():
    from langchain_ollama import ChatOllama
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    model = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
    return ChatOllama(model=model, base_url=base_url, timeout=180)


def researcher_node(state: MissionState) -> dict:
    objective = state["objective"]
    query = f"{objective} competitors pricing complaints"
    results = search_web(query, max_results=5)

    log_entry = {
        "agent": "Researcher Agent",
        "message": f"Fetched {len(results)} live sources for: '{query}'",
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

    # Build a compact snippet list — shorter prompt = faster Ollama response
    snippets = "\n".join([
        f"- {r.get('title', '')}: {r.get('snippet', '')[:200]}"
        for r in research
    ])

    prompt = (
        f"Objective: {objective}\n\n"
        f"Web research snippets:\n{snippets}\n\n"
        f"Write a concise market analysis with:\n"
        f"1. Top 3-5 competitors and their pricing\n"
        f"2. Main customer complaints\n"
        f"3. SWOT (bullet points, 2-3 items each)\n"
        f"Use markdown headers. Be brief and direct."
    )

    try:
        llm = _get_llm()
        response = llm.invoke(prompt)
        analysis_text = str(response.content)
    except Exception as e:
        snippets_fallback = "\n".join([
            f"- {r.get('title', '')}: {r.get('snippet', '')}"
            for r in research
        ])
        analysis_text = f"## Raw Research Data\n\n{snippets_fallback}\n\n*LLM unavailable: {e}*"

    log_entry = {
        "agent": "Analyst Agent",
        "message": "Completed SWOT analysis and competitor landscape.",
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

    prompt = (
        f"Objective: {objective}\n\n"
        f"Market analysis summary:\n{analysis[:1500]}\n\n"
        f"Write a concise launch plan with:\n"
        f"1. Executive Summary (2 sentences)\n"
        f"2. MVP Feature List (5-7 features)\n"
        f"3. Pricing (3 tiers with names and prices)\n"
        f"4. Launch Phases (Month 1, Month 2-3, Month 4-6)\n"
        f"Use markdown. Be specific with numbers."
    )

    try:
        llm = _get_llm()
        response = llm.invoke(prompt)
        report_body = str(response.content)
    except Exception as e:
        report_body = f"*Writer LLM unavailable: {e}*\n\n## Analysis\n{analysis}"

    sources_text = "\n".join([
        f"- [{s.get('title', 'Source')}]({s.get('url', '#')})"
        for s in sources if s.get("url")
    ])

    final_report = (
        f"# Strategic Plan: {objective}\n\n"
        f"{report_body}\n\n"
        f"---\n\n"
        f"## Sources\n{sources_text or 'Live web search.'}"
    )

    log_entry = {
        "agent": "Writer Agent",
        "message": "Compiled strategic launch plan with MVP list and go-to-market roadmap.",
        "timestamp": _get_timestamp()
    }

    return {
        "current_agent": "writer",
        "final_report": final_report,
        "status": "completed",
        "logs": state.get("logs", []) + [log_entry]
    }
