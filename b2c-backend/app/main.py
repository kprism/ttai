from __future__ import annotations

import os
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import Base, engine, get_db, User, StudySession, StudyMessage, GrowthMetric
from .auth import hash_password, verify_password, create_access_token, get_current_user
from .ai import get_socratic_reply

Base.metadata.create_all(bind=engine)

app = FastAPI(title="생각자국AI B2C API", version="0.1.0")
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

@app.post("/api/study/sessions", status_code=201)
def create_study_session(data: SessionIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = StudySession(user_id=user.id, subject=data.subject, unit=data.unit, stage=data.stage)
    db.add(session); db.commit(); db.refresh(session)
    return {"id": session.id, "subject": session.subject, "unit": session.unit, "stage": session.stage, "status": session.status}

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
