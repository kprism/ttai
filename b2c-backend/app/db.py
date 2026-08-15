from __future__ import annotations

import os
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, JSON, Boolean, UniqueConstraint, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ttai.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(80))
    role: Mapped[str] = mapped_column(String(20), default="student")
    grade: Mapped[str | None] = mapped_column(String(20), nullable=True)
    avatar: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    sessions: Mapped[list[StudySession]] = relationship(back_populates="user", cascade="all, delete-orphan")

class StudySession(Base):
    __tablename__ = "study_sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    curriculum_version_id: Mapped[int | None] = mapped_column(ForeignKey("curriculum_versions.id"), nullable=True, index=True)
    achievement_standard_id: Mapped[int | None] = mapped_column(ForeignKey("achievement_standards.id"), nullable=True, index=True)
    subject: Mapped[str] = mapped_column(String(50), default="과학")
    unit: Mapped[str] = mapped_column(String(100), default="자유낙하")
    stage: Mapped[str] = mapped_column(String(30), default="개념응용")
    status: Mapped[str] = mapped_column(String(20), default="active")
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user: Mapped[User] = relationship(back_populates="sessions")
    messages: Mapped[list[StudyMessage]] = relationship(back_populates="session", cascade="all, delete-orphan")

class StudyMessage(Base):
    __tablename__ = "study_messages"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("study_sessions.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    meta: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    session: Mapped[StudySession] = relationship(back_populates="messages")

class GrowthMetric(Base):
    __tablename__ = "growth_metrics"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    thought_expression: Mapped[int] = mapped_column(Integer, default=60)
    question_response: Mapped[int] = mapped_column(Integer, default=60)
    concept_connection: Mapped[int] = mapped_column(Integer, default=55)
    thought_revisions: Mapped[int] = mapped_column(Integer, default=0)
    hint_requests: Mapped[int] = mapped_column(Integer, default=0)
    masters: Mapped[int] = mapped_column(Integer, default=0)
    study_minutes: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CurriculumVersion(Base):
    __tablename__ = "curriculum_versions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    source_name: Mapped[str] = mapped_column(String(50), default="NCIC")
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    announced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    effective_from: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class CurriculumSubject(Base):
    __tablename__ = "curriculum_subjects"
    __table_args__ = (UniqueConstraint("version_id", "school_level", "grade_band", "name", name="uq_curr_subject"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    version_id: Mapped[int] = mapped_column(ForeignKey("curriculum_versions.id", ondelete="CASCADE"), index=True)
    school_level: Mapped[str] = mapped_column(String(20), index=True)
    grade_band: Mapped[str | None] = mapped_column(String(30), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(80), index=True)
    order_no: Mapped[int] = mapped_column(Integer, default=0)

class CurriculumUnit(Base):
    __tablename__ = "curriculum_units"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("curriculum_subjects.id", ondelete="CASCADE"), index=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("curriculum_units.id", ondelete="CASCADE"), nullable=True, index=True)
    code: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    order_no: Mapped[int] = mapped_column(Integer, default=0)
    meta: Mapped[dict] = mapped_column(JSON, default=dict)

class AchievementStandard(Base):
    __tablename__ = "achievement_standards"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("curriculum_units.id", ondelete="CASCADE"), index=True)
    code: Mapped[str] = mapped_column(String(80), index=True)
    text: Mapped[str] = mapped_column(Text)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    keywords: Mapped[list] = mapped_column(JSON, default=list)
    source_ref: Mapped[str | None] = mapped_column(Text, nullable=True)

class CurriculumImport(Base):
    __tablename__ = "curriculum_imports"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_name: Mapped[str] = mapped_column(String(50), default="NCIC")
    source_url: Mapped[str] = mapped_column(Text)
    source_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_hash: Mapped[str] = mapped_column(String(128), index=True)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    detected_change: Mapped[str] = mapped_column(String(20), default="new")
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    raw_meta: Mapped[dict] = mapped_column(JSON, default=dict)
    parsed_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    detected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
