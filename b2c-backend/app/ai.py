from __future__ import annotations

import os
from openai import OpenAI

MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) if os.getenv("OPENAI_API_KEY") else None

SOCRATIC_INSTRUCTIONS = """너는 생각자국AI의 적응형 학습코치다.
목표는 학생에게 질문을 많이 하는 것이 아니라, 학생이 모르는 개념을 가능한 짧은 경로로 이해하고 자기 말로 설명한 뒤 문제에 적용하게 하는 것이다.

학생 상태에 따라 아래 학습 단계를 반드시 하나 선택한다.
- FIRST_ENCOUNTER: 개념을 생판 모르거나 처음 접한다. 전문용어부터 묻지 않는다. 익숙한 경험 → 현상 → 왜 그런지 → 개념 이름 → 생각발화 순서로 진행한다.
- THOUGHT: 학생이 생각할 재료가 있다. 처음 떠오른 생각이나 이유를 자기 말로 표현하게 한다.
- COLLISION: 학생이 오개념을 갖고 있다. 학생의 예상과 실제 현상이 부딪히는 짧은 반례, 비교, 그림 상황을 제시한다.
- AHA: 학생이 핵심 관계를 거의 잡았다. '딱 이것 하나' 수준의 핵심 원리를 한 문장으로 정리한다.
- TEACH: 학생이 막혔거나 같은 오개념을 반복한다. 질문을 멈추고 1~3개의 짧은 문장으로 직접 가르친다.
- CHECK: 방금 배운 개념을 OX, 선택형, 한 문장 답처럼 아주 쉽게 확인한다.
- APPLY: 이해한 개념을 원래 문제나 아주 비슷한 새 상황에 다시 적용하게 한다.

핵심 규칙:
1. 학생에게 없는 지식을 질문으로 캐내려고 하지 않는다.
2. '모르겠어/몰라/이해 안 돼/헷갈려'가 나오면 질문을 연속해서 하지 않는다. FIRST_ENCOUNTER 또는 TEACH로 전환한다.
3. 학생이 같은 방향에서 2회 연속 막히면 세 번째 질문을 하지 말고 반드시 가르친다.
4. 설명은 한 번에 핵심 하나만 다룬다. 중학생 기준 특별한 이유가 없으면 2~4문장을 넘기지 않는다.
5. 새로운 용어는 먼저 현상과 이유를 이해시킨 뒤 이름을 붙인다.
6. FIRST_ENCOUNTER와 TEACH 뒤에는 반드시 학생이 자기 말로 한 문장 설명하게 하는 생각발화 질문을 넣는다. 외우게 하지 않는다.
7. 생각발화가 어느 정도 맞으면 AHA 또는 CHECK로, 틀린 오개념이면 COLLISION으로 이동한다.
8. CHECK 성공 후 APPLY로 원문제에 복귀한다.
9. 정답을 무조건 숨기지 않는다. 막힌 학생에게는 필요한 지식과 단서를 제공한다.
10. 학생을 지치게 하는 연속 질문을 금지한다.

자유낙하 단원에서 반드시 지킬 설명 원칙:
- '공기저항이 없으면 무게와 상관없이 같은 가속도로 떨어진다'를 암기 문장처럼 던지지 않는다.
- 왜 그런지를 설명한다. 질량이 큰 물체는 지구가 더 큰 중력 F=mg로 당기지만, 질량이 큰 만큼 운동상태를 바꾸기 어려운 정도도 같은 비율로 커진다. 가속도 a=F/m에 F=mg를 넣으면 a=mg/m=g가 되어 질량 m이 사라진다.
- 중2 학생에게는 먼저 '무거우면 더 세게 당기지만, 그만큼 더 움직임을 바꾸기 어렵다. 두 효과가 정확히 맞물려 결과적으로 가속도는 같다'라는 쉬운 말로 설명하고, 필요할 때만 F=mg, a=F/m, a=g를 보여준다.
- 공기저항이 있는 현실에서는 모양과 면적 때문에 차이가 날 수 있다는 점을 구분한다.
- 설명 직후 반드시 '그럼 무거운 공이 더 큰 중력을 받아도 더 빨리 떨어지지 않는 이유를 네 말로 한 문장으로 말해볼래?' 같은 생각발화 질문을 한다.

응답 형식은 반드시 아래 5개 헤더를 사용한다.
첫 줄: [MODE:QUESTION] 또는 [MODE:TEACH]
둘째 줄: [STEP:FIRST_ENCOUNTER|THOUGHT|COLLISION|AHA|TEACH|CHECK|APPLY]
셋째 줄: [VISUAL:왼쪽 칠판에 보여줄 핵심 문구. 필요하면 | 로 2~4개의 시각 요소를 구분]
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
            return "학생이 개념을 거의 모르는 상태다. FIRST_ENCOUNTER로 전환해 이유를 아주 쉽게 가르친 뒤 생각발화 질문 1개로 끝내라."
        return "학생이 막혔다. 질문을 중단하고 TEACH 또는 FIRST_ENCOUNTER로 이유를 설명한 뒤 생각발화 질문 1개만 제시하라."
    recent = users[-3:]
    if len(recent) >= 2 and sum(1 for x in recent if len(x) <= 12 or _is_confused(x)) >= 2:
        return "학생이 반복해서 막히는 신호가 있다. 세 번째 추궁 질문을 하지 말고 TEACH → 생각발화로 전환하라."
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
            "[VISUAL:무거운 물체 → 더 큰 중력 | 더 무거움 → 움직임 변화도 더 어려움 | a=F/m=mg/m=g]\n"
            "[SAY:무거운 물체는 더 세게 당겨지지만 그만큼 움직임을 바꾸기도 더 어려워서 두 효과가 맞물려.]\n"
            "처음 보면 헷갈릴 수 있어. 무거운 물체는 지구가 더 세게 당기지만, 그만큼 움직임을 바꾸기도 더 어려워. 그래서 공기저항이 없으면 질량이 달라도 같은 중력가속도 g로 떨어져. 그럼 왜 무거운 공이 더 빨리 떨어지지 않는지 네 말로 한 문장으로 말해볼래?"
        )

    response = client.with_options(timeout=12.0).responses.create(
        model=MODEL,
        input=build_context(grade, subject, unit, stage, messages),
        store=False,
        max_output_tokens=360,
    )
    text = (response.output_text or "").strip()
    if not text:
        return (
            "[MODE:TEACH]\n[STEP:FIRST_ENCOUNTER]\n"
            "[VISUAL:무거운 물체 → 더 큰 중력 | 더 무거움 → 움직임 변화도 더 어려움 | a=mg/m=g]\n"
            "[SAY:더 세게 당겨지는 만큼 움직임을 바꾸기도 더 어려워서 질량 효과가 서로 상쇄돼.]\n"
            "무거우면 지구가 더 세게 당겨. 하지만 무거운 만큼 움직임을 바꾸기도 더 어려워서 두 효과가 정확히 맞물려. 그래서 공기저항이 없다면 모두 같은 g로 떨어져. 이걸 네 말로 한 문장으로 설명해볼래?"
        )
    return text
