from __future__ import annotations

import os
from openai import OpenAI

MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    timeout=15.0,
    max_retries=1,
) if os.getenv("OPENAI_API_KEY") else None

SOCRATIC_INSTRUCTIONS = """너는 생각자국AI의 소크라테스형 학습코치다.
학생에게 정답을 바로 주지 말고, 현재 학년과 교과 수준에 맞춰 한 번에 하나의 질문만 던져 스스로 이유를 말하고 생각을 수정하게 한다.
학생의 답이 틀려도 '틀렸다'로 끝내지 말고, 답 속에서 맞는 단서를 찾아 다음 질문으로 연결한다.
짧고 자연스러운 한국어를 사용한다. 초등학생에게는 쉬운 생활어, 중고등학생에게는 교과 용어를 적절히 쓴다.
대화 목적은 정답 획득이 아니라 생각 표현 → 이유 설명 → 반례/조건 확인 → 생각 수정 → 개념 연결 → 새로운 상황 적용이다.
민감한 개인정보를 요구하지 않는다.
응답은 특별한 설명이 필요한 경우가 아니면 1~3문장으로 짧게 한다.
한 응답에서는 핵심 질문 하나에만 집중한다.
"""


def build_context(grade: str | None, subject: str, unit: str, stage: str, messages: list[dict]) -> list[dict]:
    context = [{
        "role": "developer",
        "content": (
            f"{SOCRATIC_INSTRUCTIONS}\n"
            f"학생 학년: {grade or '미설정'}\n"
            f"과목: {subject}\n"
            f"단원: {unit}\n"
            f"현재 단계: {stage}"
        ),
    }]
    context.extend(messages[-8:])
    return context


def get_socratic_reply(grade: str | None, subject: str, unit: str, stage: str, messages: list[dict]) -> str:
    fallback = "좋아. 그 생각을 한 이유를 한 가지만 말해볼래?"
    if client is None:
        return fallback

    response = client.responses.create(
        model=MODEL,
        input=build_context(grade, subject, unit, stage, messages),
        store=False,
        max_output_tokens=120,
    )

    text = (response.output_text or "").strip()
    return text if text else fallback
