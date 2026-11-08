import uuid
import asyncio
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import engine, Base, get_db, SessionLocal
from app.models import Mission, AgentLogModel
from app.graph.workflow import mission_graph

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables automatically on startup if they don't exist
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Database initialization error: {e}")
    yield

app = FastAPI(title="Orchestra AI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MissionRequest(BaseModel):
    objective: str

class AgentLogResponse(BaseModel):
    agent: str
    message: str
    timestamp: str

    class Config:
        from_attributes = True

class MissionSummaryResponse(BaseModel):
    id: str
    objective: str
    status: str
    research_count: int
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class MissionDetailResponse(BaseModel):
    id: str
    objective: str
    status: str
    research_count: int
    research_data: list
    analysis: Optional[str] = None
    final_report: Optional[str] = None
    created_at: Optional[str] = None
    logs: List[AgentLogResponse] = []

    class Config:
        from_attributes = True

@app.get("/")
def health_check():
    return {
        "status": "online",
        "system": "Orchestra AI",
        "version": "0.1.0"
    }

@app.get("/api/missions", response_model=List[MissionSummaryResponse])
def list_missions(db: Session = Depends(get_db)):
    missions = db.query(Mission).order_by(desc(Mission.created_at)).limit(20).all()
    return [
        MissionSummaryResponse(
            id=m.id,
            objective=m.objective,
            status=m.status,
            research_count=m.research_count,
            created_at=m.created_at.strftime("%Y-%m-%d %H:%M:%S") if m.created_at else None
        )
        for m in missions
    ]

@app.get("/api/missions/{mission_id}", response_model=MissionDetailResponse)
def get_mission(mission_id: str, db: Session = Depends(get_db)):
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    return MissionDetailResponse(
        id=mission.id,
        objective=mission.objective,
        status=mission.status,
        research_count=mission.research_count,
        research_data=mission.research_data or [],
        analysis=mission.analysis,
        final_report=mission.final_report,
        created_at=mission.created_at.strftime("%Y-%m-%d %H:%M:%S") if mission.created_at else None,
        logs=[
            AgentLogResponse(
                agent=log.agent,
                message=log.message,
                timestamp=log.timestamp
            )
            for log in mission.logs
        ]
    )

@app.websocket("/ws/missions")
async def websocket_mission_stream(websocket: WebSocket):
    await websocket.accept()
    mission_id = str(uuid.uuid4())
    db = SessionLocal()

    try:
        data = await websocket.receive_json()
        objective = data.get("objective", "Find profitable SaaS business opportunities")

        # Create running mission in PostgreSQL
        db_mission = Mission(
            id=mission_id,
            objective=objective,
            status="running",
            research_count=0,
            research_data=[]
        )
        db.add(db_mission)
        db.commit()

        state = {
            "mission_id": mission_id,
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

        # Send initial confirmation event to client
        await websocket.send_json({
            "type": "NODE_UPDATE",
            "mission_id": mission_id,
            "active_agent": "supervisor",
            "latest_log": {
                "agent": "Supervisor Core",
                "message": f"Initialized mission: '{objective}'. Coordinating agents.",
                "timestamp": "08:00:00"
            },
            "status": "running",
            "research_count": 0,
            "has_analysis": False,
            "final_report": None
        })
        await asyncio.sleep(1.5)

        accumulated_state = dict(state)
        for step_output in mission_graph.stream(state):
            node_name = list(step_output.keys())[0]
            node_data = step_output[node_name]
            accumulated_state.update(node_data)
            new_logs = accumulated_state.get("logs", [])
            latest_log = new_logs[-1] if new_logs else None

            await websocket.send_json({
                "type": "NODE_UPDATE",
                "mission_id": mission_id,
                "active_agent": node_name,
                "latest_log": latest_log,
                "status": accumulated_state.get("status", "running"),
                "research_count": len(accumulated_state.get("research_data", [])),
                "has_analysis": bool(accumulated_state.get("analysis")),
                "final_report": accumulated_state.get("final_report")
            })

            await asyncio.sleep(1.8)

        # Persist completed mission & logs to PostgreSQL
        db_mission.status = "completed"
        db_mission.research_count = len(accumulated_state.get("research_data", []))
        db_mission.research_data = accumulated_state.get("research_data", [])
        db_mission.analysis = accumulated_state.get("analysis")
        db_mission.final_report = accumulated_state.get("final_report")

        for log_entry in accumulated_state.get("logs", []):
            db_log = AgentLogModel(
                mission_id=mission_id,
                agent=log_entry.get("agent", "Agent"),
                message=log_entry.get("message", ""),
                timestamp=log_entry.get("timestamp", "")
            )
            db.add(db_log)

        db.commit()

        await websocket.send_json({
            "type": "MISSION_COMPLETE",
            "mission_id": mission_id,
            "status": "completed",
            "final_report": accumulated_state.get("final_report")
        })

    except WebSocketDisconnect:
        try:
            db_mission = db.query(Mission).filter(Mission.id == mission_id).first()
            if db_mission and db_mission.status == "running":
                db_mission.status = "interrupted"
                db.commit()
        except Exception:
            pass

    except Exception as e:
        try:
            db_mission = db.query(Mission).filter(Mission.id == mission_id).first()
            if db_mission:
                db_mission.status = "failed"
                db.commit()
        except Exception:
            pass

        await websocket.send_json({
            "type": "ERROR",
            "message": str(e)
        })

    finally:
        db.close()
