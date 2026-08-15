from __future__ import annotations

import os
from openai import OpenAI

MODEL = os.getenv("OPENAI_MODEL", "gpt-5")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) if os.getenv("OPENAI_API_KEY") else None

SOCRATIC_INSTRUCTIONS = """너는 생각자국AI의 소크라테스형 학습코치다.
학생에게 정답을 바로 주지 말고, 현재 학년과 교과 수준에 맞춰 한 번에 하나의 질문만 던져 스스로 이유를 말하고 생각을 수정하게 한다.
학생의 답이 틀려도 '틀렸다'로 끝내지 말고, 답 속에서 맞는 단서를 찾아 다음 질문으로 연결한다.
짧고 자연스러운 한국어를 사용한다. 초등학생에게는 쉬운 생활어, 중고등학생에게는 교과 용어를 적절히 쓴다.
대화 목적은 정답 획득이 아니라 생각 표현 → 이유 설명 → 반례/조건 확인 → 생각 수정 → 개념 연결 → 새로운 상황 적용이다.
민감한 개인정보를 요구하지 않는다.
"""

def build_context(grade: str | None, subject: str, unit: str, stage: str, messages: list[dict]) -> list[dict]:
    context = [{"role": "developer", "content": f"{SOCRATIC_INSTRUCTIONS}\n학생 학년: {grade or '미설정'}\n과목: {subject}\n단원: {unit}\n현재 단계: {stage}"}]
    context.extend(messages[-16:])
    return context

def get_socratic_reply(grade: str | None, subject: str, unit: str, stage: str, messages: list[dict]) -> str:
    if client is None:
        return "좋아. 지금 네 생각에서 가장 중요한 이유 하나만 골라서 말해볼래?"
    response = client.responses.create(
        model=MODEL,
        input=build_context(grade, subject, unit, stage, messages),
        store=False,
    )
    return response.output_text.strip()
