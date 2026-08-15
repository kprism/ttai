from __future__ import annotations

import os
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from .db import (
    Base, engine, get_db, User, StudySession, StudyMessage, GrowthMetric,
    CurriculumVersion, CurriculumSubject, CurriculumUnit, AchievementStandard,
    CurriculumConceptStrand, CurriculumUnitStrand, CurriculumUnitConnection,
    StudentCurriculumProgress,
)
from .auth import hash_password, verify_password, create_access_token, get_current_user
from .ai import get_socratic_reply

Base.metadata.create_all(bind=engine)

app = FastAPI(title="생각자국AI B2C API", version="0.2.0")
origins = [x.strip() for x in os.getenv("CORS_ORIGINS", "https://kprism.github.io,http://localhost:8000,http://127.0.0.1:8000").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=80)
    role: str = "student"
    grade: str | None = None
    avatar: str | None = "👦"

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class SessionIn(BaseModel):
    subject: str = "과학"
    unit: str = "자유낙하"
    stage: str = "개념응용"
    curriculum_version_id: int | None = None
    curriculum_unit_id: int | None = None
    achievement_standard_id: int | None = None

class MessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=8000)
    meta: dict = {}

class MetricEventIn(BaseModel):
    kind: str
    amount: int = 1

@app.get("/health")
def health():
    return {"ok": True, "service": "ttai-b2c-api"}

@app.post("/api/auth/register", status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == data.email)):
        raise HTTPException(status_code=409, detail="이미 가입된 이메일입니다.")
    user = User(email=data.email, password_hash=hash_password(data.password), name=data.name, role=data.role, grade=data.grade, avatar=data.avatar)
    db.add(user); db.flush()
    db.add(GrowthMetric(user_id=user.id))
    db.commit(); db.refresh(user)
    return {"access_token": create_access_token(user.id), "token_type": "bearer", "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role, "grade": user.grade, "avatar": user.avatar}}

@app.post("/api/auth/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email))
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="이메일 또는 비밀번호를 확인해 주세요.")
    return {"access_token": create_access_token(user.id), "token_type": "bearer", "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role, "grade": user.grade, "avatar": user.avatar}}

@app.get("/api/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "name": user.name, "role": user.role, "grade": user.grade, "avatar": user.avatar}

@app.get("/api/curriculum/active")
def active_curriculum(db: Session = Depends(get_db)):
    version = db.scalar(select(CurriculumVersion).where(CurriculumVersion.is_active == True).order_by(CurriculumVersion.id.desc()))
    if not version:
        raise HTTPException(status_code=404, detail="활성 교육과정이 없습니다.")
    return {"id": version.id, "code": version.code, "name": version.name, "source_name": version.source_name, "source_url": version.source_url}

@app.get("/api/curriculum/map")
def curriculum_map(subject: str | None = None, school_level: str | None = None, grade_band: str | None = None, db: Session = Depends(get_db)):
    version = db.scalar(select(CurriculumVersion).where(CurriculumVersion.is_active == True).order_by(CurriculumVersion.id.desc()))
    if not version:
        return {"version": None, "subjects": [], "units": [], "connections": [], "strands": []}

    subject_stmt = select(CurriculumSubject).where(CurriculumSubject.version_id == version.id)
    if subject: subject_stmt = subject_stmt.where(CurriculumSubject.name == subject)
    if school_level: subject_stmt = subject_stmt.where(CurriculumSubject.school_level == school_level)
    if grade_band: subject_stmt = subject_stmt.where(CurriculumSubject.grade_band == grade_band)
    subjects = db.scalars(subject_stmt.order_by(CurriculumSubject.order_no, CurriculumSubject.id)).all()
    subject_ids = [s.id for s in subjects]
    units = db.scalars(select(CurriculumUnit).where(CurriculumUnit.subject_id.in_(subject_ids)).order_by(CurriculumUnit.order_no, CurriculumUnit.id)).all() if subject_ids else []
    unit_ids = [u.id for u in units]

    connections = db.scalars(select(CurriculumUnitConnection).where(
        CurriculumUnitConnection.status == "approved",
        or_(CurriculumUnitConnection.from_unit_id.in_(unit_ids), CurriculumUnitConnection.to_unit_id.in_(unit_ids))
    )).all() if unit_ids else []

    strand_links = db.scalars(select(CurriculumUnitStrand).where(CurriculumUnitStrand.unit_id.in_(unit_ids))).all() if unit_ids else []
    strand_ids = list({x.strand_id for x in strand_links})
    strands = db.scalars(select(CurriculumConceptStrand).where(CurriculumConceptStrand.id.in_(strand_ids))).all() if strand_ids else []

    subject_by_id = {s.id: s for s in subjects}
    return {
        "version": {"id": version.id, "code": version.code, "name": version.name},
        "subjects": [{"id": s.id, "school_level": s.school_level, "grade_band": s.grade_band, "name": s.name, "order_no": s.order_no} for s in subjects],
        "units": [{"id": u.id, "subject_id": u.subject_id, "school_level": subject_by_id[u.subject_id].school_level if u.subject_id in subject_by_id else None, "grade_band": subject_by_id[u.subject_id].grade_band if u.subject_id in subject_by_id else None, "subject": subject_by_id[u.subject_id].name if u.subject_id in subject_by_id else None, "parent_id": u.parent_id, "code": u.code, "name": u.name, "order_no": u.order_no, "is_learning_unit": u.is_learning_unit} for u in units],
        "connections": [{"id": c.id, "from_unit_id": c.from_unit_id, "to_unit_id": c.to_unit_id, "relation_type": c.relation_type, "direction": c.direction, "strength": c.strength, "rationale": c.rationale, "source_type": c.source_type} for c in connections],
        "strands": [{"id": s.id, "code": s.code, "name": s.name, "subject_family": s.subject_family, "core_idea": s.core_idea, "units": [{"unit_id": x.unit_id, "progression_order": x.progression_order, "role": x.role} for x in strand_links if x.strand_id == s.id]} for s in strands],
    }

@app.get("/api/curriculum/progress/me")
def curriculum_progress(subject: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    version = db.scalar(select(CurriculumVersion).where(CurriculumVersion.is_active == True).order_by(CurriculumVersion.id.desc()))
    if not version:
        return {"version": None, "total_units": 0, "mastered_units": 0, "in_progress_units": 0, "not_started_units": 0, "completion_rate": 0, "current": None}

    subject_stmt = select(CurriculumSubject).where(CurriculumSubject.version_id == version.id)
    if subject: subject_stmt = subject_stmt.where(CurriculumSubject.name == subject)
    if user.grade: subject_stmt = subject_stmt.where(or_(CurriculumSubject.grade_band == user.grade, CurriculumSubject.grade_band == None))
    subjects = db.scalars(subject_stmt).all()
    subject_ids = [s.id for s in subjects]
    units = db.scalars(select(CurriculumUnit).where(CurriculumUnit.subject_id.in_(subject_ids), CurriculumUnit.is_learning_unit == True)).all() if subject_ids else []
    unit_ids = [u.id for u in units]
    progress_rows = db.scalars(select(StudentCurriculumProgress).where(StudentCurriculumProgress.user_id == user.id, StudentCurriculumProgress.curriculum_version_id == version.id, StudentCurriculumProgress.unit_id.in_(unit_ids))).all() if unit_ids else []
    pmap = {p.unit_id: p for p in progress_rows}

    total = len(units)
    mastered = sum(1 for u in units if pmap.get(u.id) and pmap[u.id].status == "mastered")
    in_progress = sum(1 for u in units if pmap.get(u.id) and pmap[u.id].status == "in_progress")
    not_started = max(0, total - mastered - in_progress)
    current_row = sorted([p for p in progress_rows if p.status == "in_progress"], key=lambda p: p.last_activity_at or datetime.min, reverse=True)
    current = current_row[0] if current_row else None
    current_unit = db.get(CurriculumUnit, current.unit_id) if current else None

    return {
        "version": {"id": version.id, "code": version.code, "name": version.name},
        "subject": subject,
        "total_units": total,
        "mastered_units": mastered,
        "in_progress_units": in_progress,
        "not_started_units": not_started,
        "completion_rate": round((mastered / total * 100), 1) if total else 0,
        "current": None if not current else {"unit_id": current.unit_id, "unit_name": current_unit.name if current_unit else None, "status": current.status, "current_stage": current.current_stage, "highest_stage": current.highest_stage, "stage_index": current.stage_index, "mastery_score": current.mastery_score},
    }

@app.get("/api/curriculum/units/{unit_id}/connections")
def unit_connections(unit_id: int, db: Session = Depends(get_db)):
    unit = db.get(CurriculumUnit, unit_id)
    if not unit: raise HTTPException(status_code=404, detail="단원을 찾을 수 없습니다.")
    rows = db.scalars(select(CurriculumUnitConnection).where(
        CurriculumUnitConnection.status == "approved",
        or_(CurriculumUnitConnection.from_unit_id == unit_id, CurriculumUnitConnection.to_unit_id == unit_id)
    )).all()
    linked_ids = {c.to_unit_id if c.from_unit_id == unit_id else c.from_unit_id for c in rows}
    linked = {u.id: u for u in db.scalars(select(CurriculumUnit).where(CurriculumUnit.id.in_(linked_ids))).all()} if linked_ids else {}
    return [{"id": c.id, "relation_type": c.relation_type, "direction": "out" if c.from_unit_id == unit_id else "in", "unit_id": c.to_unit_id if c.from_unit_id == unit_id else c.from_unit_id, "unit_name": linked.get(c.to_unit_id if c.from_unit_id == unit_id else c.from_unit_id).name if linked.get(c.to_unit_id if c.from_unit_id == unit_id else c.from_unit_id) else None, "strength": c.strength, "rationale": c.rationale} for c in rows]

@app.post("/api/study/sessions", status_code=201)
def create_study_session(data: SessionIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = StudySession(user_id=user.id, subject=data.subject, unit=data.unit, stage=data.stage, curriculum_version_id=data.curriculum_version_id, curriculum_unit_id=data.curriculum_unit_id, achievement_standard_id=data.achievement_standard_id)
    db.add(session)
    if data.curriculum_version_id and data.curriculum_unit_id:
        progress = db.scalar(select(StudentCurriculumProgress).where(StudentCurriculumProgress.user_id == user.id, StudentCurriculumProgress.unit_id == data.curriculum_unit_id))
        if not progress:
            progress = StudentCurriculumProgress(user_id=user.id, curriculum_version_id=data.curriculum_version_id, unit_id=data.curriculum_unit_id, status="in_progress", current_stage=data.stage, highest_stage=data.stage, started_at=datetime.utcnow(), last_activity_at=datetime.utcnow())
            db.add(progress)
        else:
            progress.status = "in_progress" if progress.status != "mastered" else progress.status
            progress.current_stage = data.stage
            progress.last_activity_at = datetime.utcnow()
    db.commit(); db.refresh(session)
    return {"id": session.id, "subject": session.subject, "unit": session.unit, "stage": session.stage, "status": session.status, "curriculum_unit_id": session.curriculum_unit_id}

@app.get("/api/study/sessions/{session_id}/messages")
def list_messages(session_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.get(StudySession, session_id)
    if not session or session.user_id != user.id: raise HTTPException(status_code=404, detail="학습 세션을 찾을 수 없습니다.")
    rows = db.scalars(select(StudyMessage).where(StudyMessage.session_id == session_id).order_by(StudyMessage.id)).all()
    return [{"id": m.id, "role": m.role, "content": m.content, "meta": m.meta, "created_at": m.created_at} for m in rows]

@app.post("/api/study/sessions/{session_id}/messages")
def send_message(session_id: int, data: MessageIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.get(StudySession, session_id)
    if not session or session.user_id != user.id: raise HTTPException(status_code=404, detail="학습 세션을 찾을 수 없습니다.")
    user_message = StudyMessage(session_id=session.id, role="user", content=data.content, meta=data.meta)
    db.add(user_message); db.flush()
    history_rows = db.scalars(select(StudyMessage).where(StudyMessage.session_id == session.id).order_by(StudyMessage.id)).all()
    history = [{"role": "assistant" if m.role == "assistant" else "user", "content": m.content} for m in history_rows]
    reply = get_socratic_reply(user.grade, session.subject, session.unit, session.stage, history)
    assistant_message = StudyMessage(session_id=session.id, role="assistant", content=reply, meta={})
    db.add(assistant_message)
    metric = db.scalar(select(GrowthMetric).where(GrowthMetric.user_id == user.id))
    if not metric:
        metric = GrowthMetric(user_id=user.id); db.add(metric)
    metric.thought_expression = min(100, metric.thought_expression + 1)
    metric.question_response = min(100, metric.question_response + 1)
    metric.study_minutes += 1
    if session.curriculum_unit_id:
        progress = db.scalar(select(StudentCurriculumProgress).where(StudentCurriculumProgress.user_id == user.id, StudentCurriculumProgress.unit_id == session.curriculum_unit_id))
        if progress:
            progress.attempts += 1
            progress.last_activity_at = datetime.utcnow()
    session.updated_at = datetime.utcnow()
    db.commit(); db.refresh(assistant_message)
    return {"user_message_id": user_message.id, "assistant_message": {"id": assistant_message.id, "role": "assistant", "content": assistant_message.content}}

@app.post("/api/growth/events")
def growth_event(data: MetricEventIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    metric = db.scalar(select(GrowthMetric).where(GrowthMetric.user_id == user.id))
    if not metric:
        metric = GrowthMetric(user_id=user.id); db.add(metric)
    amount = max(1, min(data.amount, 20))
    if data.kind == "thought_revision": metric.thought_revisions += amount
    elif data.kind == "hint_request": metric.hint_requests += amount
    elif data.kind == "concept_connection": metric.concept_connection = min(100, metric.concept_connection + amount)
    elif data.kind == "master": metric.masters += amount
    else: raise HTTPException(status_code=400, detail="지원하지 않는 성장 이벤트입니다.")
    db.commit()
    return {"ok": True}

@app.get("/api/growth/me")
def growth(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    metric = db.scalar(select(GrowthMetric).where(GrowthMetric.user_id == user.id))
    if not metric:
        metric = GrowthMetric(user_id=user.id); db.add(metric); db.commit(); db.refresh(metric)
    return {"thought_expression": metric.thought_expression, "question_response": metric.question_response, "concept_connection": metric.concept_connection, "thought_revisions": metric.thought_revisions, "hint_requests": metric.hint_requests, "masters": metric.masters, "study_minutes": metric.study_minutes, "updated_at": metric.updated_at}
