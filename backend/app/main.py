import uuid
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.graph.workflow import mission_graph

app = FastAPI(title="Orchestra AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MissionRequest(BaseModel):
    objective: str

@app.get("/")
def health_check():
    return {
        "status": "online",
        "system": "Orchestra AI",
        "version": "0.1.0"
    }

@app.get("/api/missions/test")
def run_test_mission():
    initial_state = {
        "mission_id": str(uuid.uuid4()),
        "objective": "Build a SaaS product for restaurant inventory and cost tracking",
        "current_agent": "supervisor",
        "next_step": "supervisor",
        "iteration_count": 0,
        "research_data": [],
        "analysis": None,
        "final_report": None,
        "logs": [],
        "status": "running"
    }
    final_state = mission_graph.invoke(initial_state)
    return {
        "mission_id": final_state["mission_id"],
        "status": final_state["status"],
        "total_steps": final_state["iteration_count"],
        "logs": final_state["logs"],
        "deliverable": final_state["final_report"]
    }

@app.websocket("/ws/missions")
async def websocket_mission_stream(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        objective = data.get("objective", "Find profitable SaaS business opportunities")

        state = {
            "mission_id": str(uuid.uuid4()),
            "objective": objective,
            "current_agent": "supervisor",
            "next_step": "supervisor",
            "iteration_count": 0,
            "research_data": [],
            "analysis": None,
            "final_report": None,
            "logs": [],
            "status": "running"
        }

        # Send initial confirmation event
        await websocket.send_json({
            "type": "NODE_UPDATE",
            "active_agent": "supervisor",
            "latest_log": {
                "agent": "Supervisor Core",
                "message": f"Initialized mission objective: '{objective}'. Evaluating task plan.",
                "timestamp": "08:00:00"
            },
            "status": "running",
            "research_count": 0,
            "has_analysis": False,
            "final_report": None
        })
        await asyncio.sleep(2.0)

        # Stream LangGraph execution with deliberate 2.2-second pauses
        for step_output in mission_graph.stream(state):
            node_name = list(step_output.keys())[0]
            updated_state = step_output[node_name]
            new_logs = updated_state.get("logs", [])
            latest_log = new_logs[-1] if new_logs else None

            await websocket.send_json({
                "type": "NODE_UPDATE",
                "active_agent": node_name,
                "latest_log": latest_log,
                "status": updated_state.get("status", "running"),
                "research_count": len(updated_state.get("research_data", [])),
                "has_analysis": bool(updated_state.get("analysis")),
                "final_report": updated_state.get("final_report")
            })

            # Pacing pause so network transitions and timeline bars can be clearly observed
            await asyncio.sleep(2.2)

        await websocket.send_json({
            "type": "MISSION_COMPLETE",
            "status": "completed"
        })
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({
            "type": "ERROR",
            "message": str(e)
        })
