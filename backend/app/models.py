from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Mission(Base):
    __tablename__ = "missions"

    id = Column(String, primary_key=True, index=True)
    objective = Column(Text, nullable=False)
    status = Column(String, default="running", index=True)
    research_count = Column(Integer, default=0)
    research_data = Column(JSON, default=list)
    analysis = Column(Text, nullable=True)
    final_report = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    logs = relationship("AgentLogModel", back_populates="mission", cascade="all, delete-orphan")

class AgentLogModel(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mission_id = Column(String, ForeignKey("missions.id", ondelete="CASCADE"), index=True)
    agent = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    mission = relationship("Mission", back_populates="logs")

