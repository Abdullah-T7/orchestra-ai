from langgraph.graph import StateGraph, END
from app.graph.state import MissionState
from app.graph.supervisor import supervisor_node
from app.graph.workers import researcher_node, analyst_node, writer_node

def create_mission_graph():
    workflow = StateGraph(MissionState)

    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("researcher", researcher_node)
    workflow.add_node("analyst", analyst_node)
    workflow.add_node("writer", writer_node)

    workflow.set_entry_point("supervisor")

    workflow.add_conditional_edges(
        "supervisor",
        lambda state: state["next_step"],
        {
            "researcher": "researcher",
            "analyst": "analyst",
            "writer": "writer",
            "FINISH": END,
        }
    )

    workflow.add_edge("researcher", "supervisor")
    workflow.add_edge("analyst", "supervisor")
    workflow.add_edge("writer", "supervisor")

    return workflow.compile()

mission_graph = create_mission_graph()

