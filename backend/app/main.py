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

@app.post("/api/missions/run")
def run_mission(request: MissionRequest):
    initial_state = {
        "mission_id": str(uuid.uuid4()),
        "objective": request.objective,
        "current_agent": "supervisor",
        "next_step": "supervisor",
        "iteration_count": 0,
        "research_data": [],
        "analysis": None,
        "final_report": None,
        "logs": [],
        "status": "running"
    }
    return mission_graph.invoke(initial_state)

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
            await asyncio.sleep(0.5)

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
