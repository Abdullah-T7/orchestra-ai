from typing import TypedDict, List, Dict, Any, Optional

class AgentLog(TypedDict):
    agent: str
    message: str
    timestamp: str

class MissionState(TypedDict):
    mission_id: str
    objective: str

    current_agent: str
    next_step: str
    iteration_count: int

    research_data: List[Dict[str, Any]]
    analysis: Optional[str]
    final_report: Optional[str]

    logs: List[AgentLog]
    status: str

