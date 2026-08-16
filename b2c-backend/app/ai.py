from __future__ import annotations

import os
from openai import OpenAI

MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) if os.getenv("OPENAI_API_KEY") else None

SOCRATIC_INSTRUCTIONS = """너는 생각자국AI의 소크라테스형 학습코치다.
목표는 학생을 계속 질문으로 몰아붙이는 것이 아니라, 스스로 생각하게 하되 막히면 즉시 가르쳐 주는 것이다.

반드시 두 모드 중 하나를 선택한다.
1) QUESTION 모드: 학생이 개념을 어느 정도 이해하고 있고 스스로 다음 생각을 이어갈 수 있을 때만 사용한다. 짧은 피드백 뒤 핵심 질문 1개만 한다.
2) TEACH 모드: 학생이 '모르겠어/몰라/이해 안 돼/헷갈려'라고 하거나, 같은 오개념을 반복하거나, 문제 해결 방향과 다른 답을 2회 이상 이어갈 때 사용한다. 이때는 질문을 계속하지 않는다. 먼저 2~4문장으로 핵심 개념을 직접 가르치고, 아주 쉬운 확인 질문 1개만 한다.

TEACH 모드에서는 왼쪽 시각자료에 표시할 핵심 포인트를 짧게 제시한다.
학생의 답이 틀려도 공격적으로 '틀렸다'고 하지 말고, 맞는 단서를 짚은 뒤 부족한 부분을 설명한다.
초등학생에게는 쉬운 생활어, 중고등학생에게는 교과 용어를 적절히 쓴다.
정답을 무조건 숨기는 것이 목표가 아니다. 학생이 막히면 필요한 설명을 주고 다시 생각할 발판을 만든다.
민감한 개인정보를 요구하지 않는다.

응답 형식은 반드시 아래와 같이 한다.
첫 줄: [MODE:QUESTION] 또는 [MODE:TEACH]
둘째 줄: [VISUAL:시각자료에 보여줄 핵심 문구]  (QUESTION 모드에서는 비워도 됨)
그 다음 줄부터 학생에게 보여줄 실제 답변.
"""

CONFUSION_WORDS = (
    "모르겠", "몰라", "모르겠어", "잘 모르", "이해 안", "이해가 안",
    "헷갈", "감이 안", "모르는데", "모름",
)


def _force_teach(messages: list[dict]) -> bool:
    user_messages = [str(m.get("content", "")).strip() for m in messages if m.get("role") == "user"]
    if not user_messages:
        return False
    last = user_messages[-1].replace(" ", "")
    return any(word.replace(" ", "") in last for word in CONFUSION_WORDS)


def build_context(grade: str | None, subject: str, unit: str, stage: str, messages: list[dict]) -> list[dict]:
    mode_hint = "이번 응답은 반드시 TEACH 모드로 시작하라." if _force_teach(messages) else (
        "최근 답변 흐름을 보고 학생이 반복해서 막히거나 방향을 잃고 있으면 TEACH 모드로 전환하라. "
        "학생이 충분히 따라오고 있을 때만 QUESTION 모드를 사용하라."
    )
    context = [{
        "role": "developer",
        "content": (
            f"{SOCRATIC_INSTRUCTIONS}\n"
            f"학생 학년: {grade or '미설정'}\n"
            f"과목: {subject}\n단원: {unit}\n현재 단계: {stage}\n"
            f"모드 판정 지침: {mode_hint}"
        ),
    }]
    context.extend(messages[-8:])
    return context


def get_socratic_reply(grade: str | None, subject: str, unit: str, stage: str, messages: list[dict]) -> str:
    if client is None:
        return "[MODE:TEACH]\n[VISUAL:핵심 개념을 한 번 짚어보기]\n지금은 질문을 더 하기보다 개념을 한 번 정리해볼게. 핵심을 보고 나서 아주 쉬운 것부터 다시 확인해보자."

    response = client.with_options(timeout=12.0).responses.create(
        model=MODEL,
        input=build_context(grade, subject, unit, stage, messages),
        store=False,
        max_output_tokens=260,
    )
    text = (response.output_text or "").strip()
    if not text:
        return "[MODE:TEACH]\n[VISUAL:같이 떨어지는 두 물체의 움직임 비교]\n지금은 질문을 더 하지 않을게. 엘리베이터와 사람이 함께 자유낙하하면 둘 다 같은 중력가속도로 내려가서 바닥이 사람을 밀 필요가 거의 없어. 그럼 사람이 바닥을 세게 누를까, 거의 누르지 않을까?"
    return text
