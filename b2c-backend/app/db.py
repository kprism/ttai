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
    is_learning_unit: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
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

class CurriculumConceptStrand(Base):
    """초·중·고를 관통하는 개념 축. 예: 힘과 운동, 물질, 생명, 지구와 우주."""
    __tablename__ = "curriculum_concept_strands"
    __table_args__ = (UniqueConstraint("version_id", "subject_family", "code", name="uq_curriculum_strand"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    version_id: Mapped[int] = mapped_column(ForeignKey("curriculum_versions.id", ondelete="CASCADE"), index=True)
    subject_family: Mapped[str] = mapped_column(String(80), index=True)
    code: Mapped[str] = mapped_column(String(80), index=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    core_idea: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_ref: Mapped[str | None] = mapped_column(Text, nullable=True)

class CurriculumUnitStrand(Base):
    """각 학년/학교급 단원을 하나 이상의 종적 개념 축에 배치한다."""
    __tablename__ = "curriculum_unit_strands"
    __table_args__ = (UniqueConstraint("unit_id", "strand_id", name="uq_unit_strand"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("curriculum_units.id", ondelete="CASCADE"), index=True)
    strand_id: Mapped[int] = mapped_column(ForeignKey("curriculum_concept_strands.id", ondelete="CASCADE"), index=True)
    progression_order: Mapped[int] = mapped_column(Integer, default=0, index=True)
    role: Mapped[str] = mapped_column(String(30), default="core")
    source_ref: Mapped[str | None] = mapped_column(Text, nullable=True)

class CurriculumUnitConnection(Base):
    """교육과정 맵의 횡·종 연결선.

    relation_type 예:
    prerequisite, next, vertical, horizontal, cross_subject, school_transition, related.
    운영자가 승인한 연결만 실제 추천/진도 계산에 사용한다.
    """
    __tablename__ = "curriculum_unit_connections"
    __table_args__ = (UniqueConstraint("from_unit_id", "to_unit_id", "relation_type", name="uq_curriculum_connection"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    from_unit_id: Mapped[int] = mapped_column(ForeignKey("curriculum_units.id", ondelete="CASCADE"), index=True)
    to_unit_id: Mapped[int] = mapped_column(ForeignKey("curriculum_units.id", ondelete="CASCADE"), index=True)
    relation_type: Mapped[str] = mapped_column(String(40), index=True)
    direction: Mapped[str] = mapped_column(String(20), default="directed")
    strength: Mapped[int] = mapped_column(Integer, default=100)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_type: Mapped[str] = mapped_column(String(30), default="official")
    source_ref: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="approved", index=True)
    meta: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class StudentCurriculumProgress(Base):
    """학생이 국가 교육과정 지도에서 현재 어디까지 왔는지 기록한다.

    교육과정 단원 하나가 생각자국AI의 학습 단위이고, 그 안에서
    기초→변형→응용→Lv1→Lv2→Lv3(MASTER) 단계를 밟는다.
    """
    __tablename__ = "student_curriculum_progress"
    __table_args__ = (UniqueConstraint("user_id", "unit_id", name="uq_student_unit_progress"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    curriculum_version_id: Mapped[int] = mapped_column(ForeignKey("curriculum_versions.id"), index=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("curriculum_units.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="not_started", index=True)
    current_stage: Mapped[str] = mapped_column(String(30), default="개념기초")
    highest_stage: Mapped[str] = mapped_column(String(30), default="개념기초")
    stage_index: Mapped[int] = mapped_column(Integer, default=0)
    mastery_score: Mapped[int] = mapped_column(Integer, default=0)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    thought_revisions: Mapped[int] = mapped_column(Integer, default=0)
    hint_requests: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    mastered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_activity_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    meta: Mapped[dict] = mapped_column(JSON, default=dict)

class StudySession(Base):
    __tablename__ = "study_sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    curriculum_version_id: Mapped[int | None] = mapped_column(ForeignKey("curriculum_versions.id"), nullable=True, index=True)
    curriculum_unit_id: Mapped[int | None] = mapped_column(ForeignKey("curriculum_units.id"), nullable=True, index=True)
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
