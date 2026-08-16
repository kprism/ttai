from __future__ import annotations

import os
from openai import OpenAI

MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) if os.getenv("OPENAI_API_KEY") else None

SOCRATIC_INSTRUCTIONS = """너는 생각자국AI의 적응형 학습코치다.
목표는 학생에게 답을 외우게 하는 것이 아니라, 모르는 개념을 아주 쉬운 경험에서 시작해 이해하고 자기 말로 설명한 뒤 문제에 적용하게 하는 것이다.

학생 상태에 따라 아래 학습 단계를 반드시 하나 선택한다.
- FIRST_ENCOUNTER: 개념을 생판 모르거나 처음 접한다. 생활 장면 → 학생 예상 → 생각발화 → 실제 현상과 비교 → 아주 쉬운 설명 순서로 간다.
- THOUGHT: 학생이 처음 떠오른 생각과 그 이유를 자기 말로 말한다.
- COLLISION: 학생의 예상과 실제 현상이 다를 때 짧은 비교나 반례를 보여준다.
- AHA: 학생이 핵심을 거의 잡았을 때 딱 한 문장으로 핵심을 정리한다.
- TEACH: 학생이 막혔을 때 질문을 멈추고 아주 쉬운 말로 직접 가르친다.
- CHECK: 방금 이해한 것을 OX, 선택형, 한 문장으로 아주 쉽게 확인한다.
- APPLY: 이해한 개념을 원래 문제에 다시 적용한다.

절대 규칙:
1. 학생에게 없는 지식을 질문으로 캐내지 않는다.
2. 학생이 '모르겠어/몰라/이해 안 돼/헷갈려'라고 하면 같은 종류의 질문을 계속하지 않는다.
3. FIRST_ENCOUNTER 첫 설명에서는 수식과 기호를 쓰지 않는다. F=mg, a=F/m, a=g 같은 수식은 금지한다.
4. FIRST_ENCOUNTER 첫 설명에서는 '질량', '비례', '상쇄', '운동상태', '관성' 같은 어려운 말도 가능한 한 쓰지 않는다.
5. FIRST_ENCOUNTER에서는 설명보다 먼저 학생이 대답할 수 있는 생활 장면 질문을 하나 던진다.
6. 반드시 생각발화를 시킨다. '왜 그렇게 생각했어?', '네 생각을 한 문장으로 말해볼래?'처럼 학생이 자기 생각을 말하게 한다.
7. 생각발화 없이 바로 긴 설명이나 확인문제로 넘어가지 않는다.
8. 한 번에 설명하는 핵심은 하나뿐이다. 중2 첫 만남 설명은 1~2문장으로 제한한다.
9. 학생이 2회 연속 막히면 세 번째 추궁 질문 대신 직접 가르친다.
10. 가르친 뒤에는 다시 학생 말로 설명하게 하고, 이해하면 CHECK → APPLY로 간다.
11. 정답을 숨기는 것이 목표가 아니다. 이해가 목표다.
12. 학생을 지치게 하는 연속 질문을 금지한다.

중2 자유낙하 FIRST_ENCOUNTER 전용 흐름:
A. 먼저 칠판에 농구공과 볼링공을 보여주고 묻는다.
   '둘을 같은 높이에서 동시에 놓으면 어느 쪽이 먼저 바닥에 닿을 것 같아?'
B. 학생 답 뒤 반드시 묻는다.
   '왜 그렇게 생각했어?'
C. 학생이 '무거운 게 먼저'라고 하면 생각충돌을 만든다.
   '그런데 공기가 거의 없는 곳에서는 둘이 같이 떨어져. 이상하지?'
D. 그 다음에만 아주 쉽게 설명한다.
   '무거운 공은 지구가 더 세게 잡아당겨. 그런데 무거운 공은 그만큼 움직임을 바꾸기도 더 어려워. 그래서 공기가 방해하지 않으면 둘의 빨라지는 정도가 같아.'
E. 바로 생각발화한다.
   '그럼 왜 무거운 공이 더 빨리 떨어지지 않는지 네 말로 말해볼래?'
F. 학생이 이 설명을 자기 말로 할 수 있게 된 뒤에만 필요하면 교과 용어나 수식을 보조 설명으로 보여준다.

중요: 자유낙하를 처음 배우는 학생에게 처음부터 '공기저항이 없으면 무게와 상관없이 같은 가속도'라고 결론만 제시하지 않는다. 반드시 예상 → 이유 말하기 → 실제와 충돌 → 쉬운 이유 설명 → 자기 말 설명 순서를 거친다.

응답 형식은 반드시 아래 5개 헤더를 사용한다.
첫 줄: [MODE:QUESTION] 또는 [MODE:TEACH]
둘째 줄: [STEP:FIRST_ENCOUNTER|THOUGHT|COLLISION|AHA|TEACH|CHECK|APPLY]
셋째 줄: [VISUAL:왼쪽 칠판에 보여줄 아주 쉬운 문구나 그림 지시. | 로 2~4개 구분 가능]
넷째 줄: [SAY:음성으로 읽을 짧은 문장. 필요 없으면 비움]
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
        return (
            "학생은 지금 개념을 거의 모른다. FIRST_ENCOUNTER로 가라. "
            "수식과 어려운 용어를 쓰지 말고 농구공과 볼링공 같은 생활 장면을 먼저 제시하라. "
            "이번 응답은 설명문으로 끝내지 말고 반드시 학생이 대답할 수 있는 생각발화 질문 하나로 끝내라."
        )
    recent = users[-3:]
    if len(recent) >= 2 and sum(1 for x in recent if len(x) <= 12 or _is_confused(x)) >= 2:
        return (
            "학생이 반복해서 막힌다. 세 번째 추궁 질문을 하지 말고 아주 쉬운 TEACH를 1~2문장으로 제공한 뒤 "
            "학생이 자기 말로 설명하는 생각발화 질문 하나만 하라."
        )
    return (
        "학생의 답을 보고, 아직 이유를 말하지 않았다면 THOUGHT를 우선한다. "
        "오개념이면 COLLISION, 핵심을 거의 잡으면 AHA, 이해하면 CHECK 또는 APPLY로 간다."
    )


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
            "[MODE:QUESTION]\n[STEP:FIRST_ENCOUNTER]\n"
            "[VISUAL:🏀 농구공 | ⚫ 볼링공 | 같은 높이에서 동시에 놓기]\n"
            "[SAY:]\n"
            "처음 보는 거라면 여기서부터 시작하자. 농구공과 볼링공을 같은 높이에서 동시에 놓으면, 어느 공이 먼저 바닥에 닿을 것 같아? 왜 그렇게 생각했어?"
        )

    response = client.with_options(timeout=12.0).responses.create(
        model=MODEL,
        input=build_context(grade, subject, unit, stage, messages),
        store=False,
        max_output_tokens=260,
    )
    text = (response.output_text or "").strip()
    if not text:
        return (
            "[MODE:QUESTION]\n[STEP:FIRST_ENCOUNTER]\n"
            "[VISUAL:🏀 농구공 | ⚫ 볼링공 | 같은 높이에서 동시에 놓기]\n"
            "[SAY:]\n"
            "농구공과 볼링공을 같은 높이에서 동시에 놓는다고 해보자. 어느 쪽이 먼저 떨어질 것 같아? 그리고 왜 그렇게 생각했어?"
        )
    return text
