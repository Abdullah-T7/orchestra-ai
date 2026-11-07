from datetime import datetime
from app.graph.state import MissionState

def _get_timestamp() -> str:
    return datetime.now().strftime("%H:%M:%S")

def supervisor_node(state: MissionState) -> dict:
    iteration = state.get("iteration_count", 0) + 1
    logs = list(state.get("logs", []))

    if iteration > 10:
        logs.append({
            "agent": "Supervisor",
            "message": "Maximum step limit reached. Finalizing mission.",
            "timestamp": _get_timestamp()
        })
        return {
            "iteration_count": iteration,
            "next_step": "FINISH",
            "current_agent": "supervisor",
            "status": "completed",
            "logs": logs
        }

    if not state.get("research_data"):
        next_step = "researcher"
        message = "Assigned task to Researcher Agent."
    elif not state.get("analysis"):
        next_step = "analyst"
        message = "Assigned task to Analyst Agent."
    elif not state.get("final_report"):
        next_step = "writer"
        message = "Assigned task to Writer Agent."
    else:
        next_step = "FINISH"
        message = "All agent deliverables completed."

    logs.append({
        "agent": "Supervisor",
        "message": message,
        "timestamp": _get_timestamp()
    })

    return {
        "iteration_count": iteration,
        "next_step": next_step,
        "current_agent": "supervisor",
        "logs": logs
    }

