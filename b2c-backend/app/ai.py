from __future__ import annotations

import os
from openai import OpenAI

MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) if os.getenv("OPENAI_API_KEY") else None

SOCRATIC_INSTRUCTIONS = """너는 생각자국AI의 적응형 학습코치다.
목표는 학생에게 질문을 많이 하는 것이 아니라, 학생이 모르는 개념을 가능한 짧은 경로로 이해하고 자기 말로 설명한 뒤 문제에 적용하게 하는 것이다.

학생 상태에 따라 아래 학습 단계를 반드시 하나 선택한다.
- FIRST_ENCOUNTER: 개념을 생판 모르거나 처음 접한다. 전문용어부터 묻지 않는다. 익숙한 생활 경험 → 관찰/예상 → 현상 → 개념 이름 순서로 아주 쉽게 가르친다.
- THOUGHT: 학생이 생각할 재료가 있다. 처음 떠오른 생각이나 이유를 자기 말로 표현하게 한다.
- COLLISION: 학생이 오개념을 갖고 있다. 학생의 예상과 실제 현상이 부딪히는 짧은 반례, 비교, 그림 상황을 제시한다.
- AHA: 학생이 핵심 관계를 거의 잡았다. '딱 이것 하나' 수준의 핵심 원리를 한 문장으로 정리한다.
- TEACH: 학생이 막혔거나 같은 오개념을 반복한다. 질문을 멈추고 1~2개의 짧은 문장으로 직접 가르친다.
- CHECK: 방금 배운 개념을 OX, 선택형, 한 문장 답처럼 아주 쉽게 확인한다.
- APPLY: 이해한 개념을 원래 문제나 아주 비슷한 새 상황에 다시 적용하게 한다.

핵심 규칙:
1. 학생에게 없는 지식을 질문으로 캐내려고 하지 않는다.
2. '모르겠어/몰라/이해 안 돼/헷갈려'가 나오면 질문을 연속해서 하지 않는다. FIRST_ENCOUNTER 또는 TEACH로 전환한다.
3. 학생이 같은 방향에서 2회 연속 막히면 세 번째 질문을 하지 말고 반드시 가르친다.
4. 설명은 한 번에 핵심 하나만 다룬다. 중학생 기준 특별한 이유가 없으면 2~3문장을 넘기지 않는다.
5. 새로운 용어는 먼저 현상이나 생활 경험을 이해시킨 뒤 이름을 붙인다.
6. 가르친 뒤에는 반드시 아주 쉬운 CHECK를 거쳐 성공하면 APPLY로 원문제에 복귀한다.
7. 정답을 무조건 숨기지 않는다. 막힌 학생에게는 필요한 지식과 단서를 제공한다.
8. 초등학생은 쉬운 생활어, 중고등학생은 필요한 교과 용어를 쓰되 처음부터 정의문을 길게 읽지 않는다.
9. 학생을 지치게 하는 연속 질문을 금지한다.

응답 형식은 반드시 아래 5개 헤더를 사용한다.
첫 줄: [MODE:QUESTION] 또는 [MODE:TEACH]
둘째 줄: [STEP:FIRST_ENCOUNTER|THOUGHT|COLLISION|AHA|TEACH|CHECK|APPLY]
셋째 줄: [VISUAL:왼쪽 화면에 보여줄 아주 짧은 시각 포인트]
넷째 줄: [SAY:음성으로 읽을 짧은 핵심 문장. 필요 없으면 비움]
다섯째 줄부터: 학생에게 보여줄 실제 답변
"""

CONFUSION_WORDS = (
    "모르겠", "몰라", "잘 모르", "이해 안", "이해가 안", "헷갈",
    "감이 안", "모르는데", "모름", "처음 봐", "처음보", "무슨 말",
)


def _user_messages(messages: list[dict]) -> list[str]:
    return [str(m.get("content", "")).strip() for m in messages if m.get("role") == "user"]


def _is_confused(text: str) -> bool:
    compact = text.replace(" ", "")
    return any(word.replace(" ", "") in compact for word in CONFUSION_WORDS)


def _mode_hint(messages: list[dict]) -> str:
    users = _user_messages(messages)
    if not users:
        return "THOUGHT 단계로 시작하라."
    last = users[-1]
    if _is_confused(last):
        if len(users) <= 2:
            return "학생이 개념을 거의 모르는 상태다. FIRST_ENCOUNTER로 전환하여 익숙한 경험부터 아주 쉽게 가르쳐라."
        return "학생이 막혔다. 질문을 중단하고 TEACH 또는 FIRST_ENCOUNTER를 사용한 뒤 아주 쉬운 CHECK 하나만 제시하라."
    recent = users[-3:]
    if len(recent) >= 2 and sum(1 for x in recent if len(x) <= 12 or _is_confused(x)) >= 2:
        return "학생이 반복해서 막히는 신호가 있다. 세 번째 추궁 질문을 하지 말고 TEACH → CHECK로 전환하라."
    return "학생이 가진 생각을 활용하되, 오개념이면 COLLISION, 거의 이해했으면 AHA 또는 CHECK, 이해했으면 APPLY를 선택하라."


def build_context(grade: str | None, subject: str, unit: str, stage: str, messages: list[dict]) -> list[dict]:
    context = [{
        "role": "developer",
        "content": (
            f"{SOCRATIC_INSTRUCTIONS}\n"
            f"학생 학년: {grade or '미설정'}\n"
            f"과목: {subject}\n단원: {unit}\n현재 문제 단계: {stage}\n"
            f"현재 판정 힌트: {_mode_hint(messages)}"
        ),
    }]
    context.extend(messages[-8:])
    return context


def get_socratic_reply(grade: str | None, subject: str, unit: str, stage: str, messages: list[dict]) -> str:
    if client is None:
        return (
            "[MODE:TEACH]\n[STEP:FIRST_ENCOUNTER]\n"
            "[VISUAL:사람과 엘리베이터가 함께 아래로 떨어지는 모습을 비교]\n"
            "[SAY:둘이 함께 떨어지면 먼저 둘의 움직임이 같은지부터 보면 돼.]\n"
            "처음 보는 개념이어도 괜찮아. 엘리베이터와 사람은 둘 다 중력 때문에 함께 아래로 떨어져. "
            "먼저 둘 중 누가 더 빨리 바닥 쪽으로 가까워지는지 그림에서 찾아볼까?"
        )

    response = client.with_options(timeout=12.0).responses.create(
        model=MODEL,
        input=build_context(grade, subject, unit, stage, messages),
        store=False,
        max_output_tokens=320,
    )
    text = (response.output_text or "").strip()
    if not text:
        return (
            "[MODE:TEACH]\n[STEP:TEACH]\n"
            "[VISUAL:엘리베이터 ↓ g = 사람 ↓ g]\n"
            "[SAY:둘 다 같은 중력가속도로 함께 떨어진다는 것부터 기억하면 돼.]\n"
            "지금은 질문을 더 하지 않을게. 엘리베이터와 사람은 함께 같은 중력가속도로 떨어져. "
            "그럼 사람이 바닥을 세게 누를 필요가 있을까, 거의 없을까?"
        )
    return text
