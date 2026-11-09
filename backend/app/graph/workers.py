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
    results, from_cache = search_web(query, max_results=5)

    source_note = "cache" if from_cache else "live web search"
    log_entry = {
        "agent": "Researcher Agent",
        "message": f"Fetched {len(results)} sources via {source_note} for: '{query}'",
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

    snippets = "\n".join([
        f"- {r.get('title', '')}: {r.get('snippet', '')[:200]}"
        for r in research
    ])

    prompt = (
        f"Objective: {objective}\n\n"
        f"Web research snippets:\n{snippets}\n\n"
        f"You are a market analyst. Produce a concise analysis with:\n"
        f"1. A Structured Competitor Comparison Matrix as a Markdown Table with exact columns:\n"
        f"| Competitor | Est. Pricing | Key Strength | Main Customer Complaint |\n"
        f"|---|---|---|---|\n"
        f"Include at least 3-4 real competitors derived from the snippets.\n\n"
        f"2. SWOT Analysis (2-3 bullet points each for Strengths, Weaknesses, Opportunities, Threats)\n"
        f"3. Identified Market Gap (what competitors are missing)\n"
        f"Keep it realistic, direct, and concise."
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
        "message": "Synthesized competitor comparison matrix and SWOT analysis.",
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
        f"Market analysis & competitor data:\n{analysis}\n\n"
        f"Write a complete strategic execution plan that includes:\n"
        f"1. Executive Summary (2 sentences)\n"
        f"2. Competitor Landscape & Comparison Matrix (include the markdown table from analysis)\n"
        f"3. MVP Feature Scope (5-7 prioritized features with descriptions)\n"
        f"4. Pricing Strategy (3 tiers: Name, Monthly Price, Target Audience)\n"
        f"5. Go-To-Market Roadmap (Month 1, Month 2-3, Month 4-6 milestones)\n"
        f"Use clean markdown headers. Keep the competitor table intact and format as clean markdown."
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
        "message": "Compiled strategic launch plan with competitor matrix and roadmap.",
        "timestamp": _get_timestamp()
    }

    return {
        "current_agent": "writer",
        "final_report": final_report,
        "status": "completed",
        "logs": state.get("logs", []) + [log_entry]
    }


def refine_strategy(objective: str, current_report: str, instruction: str) -> str:
    prompt = (
        f"You are the Writer agent refining a strategic execution brief.\n\n"
        f"ORIGINAL OBJECTIVE: {objective}\n\n"
        f"CURRENT STRATEGY BRIEF:\n{current_report}\n\n"
        f"USER REFINEMENT INSTRUCTION: \"{instruction}\"\n\n"
        f"Please update and improve the strategy brief based on the user's instruction.\n"
        f"Maintain the professional markdown structure, existing sections, and comparison tables, but expand, adjust, or deepen the requested sections.\n"
        f"Return the complete updated brief in markdown."
    )
    try:
        llm = _get_llm()
        response = llm.invoke(prompt)
        return str(response.content)
    except Exception as e:
        return f"{current_report}\n\n---\n\n### Refinement Note\nCould not apply feedback automatically: {e}"
