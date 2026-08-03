(() => {
  "use strict";

  const KEYS = {
    session: "ttai_demo_session",
    growth: "ttai_growth_records",
    feedback: "ttai_teacher_feedbacks"
  };

  const gradeLabels = {
    e1: "초등학교 1학년", e2: "초등학교 2학년", e3: "초등학교 3학년",
    e4: "초등학교 4학년", e5: "초등학교 5학년", e6: "초등학교 6학년",
    m1: "중학교 1학년", m2: "중학교 2학년", m3: "중학교 3학년",
    h1: "고등학교 1학년", h2: "고등학교 2학년", h3: "고등학교 3학년"
  };

  function read(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function daysAgo(days) {
    return new Date(Date.now() - days * 86400000).toISOString();
  }

  function sampleRecords(grade) {
    const label = gradeLabels[grade] || gradeLabels.m2;
    return [
      {
        id: "sample-equation",
        date: daysAgo(0),
        grade,
        subject: "수학",
        topic: "등식의 성질과 일차방정식",
        title: "규칙 암기에서 원리 이해로 한 걸음 성장했어요",
        summary: "이항할 때 부호가 저절로 바뀌는 것이 아니라 등식의 양쪽에 같은 연산을 해야 균형이 유지된다는 원리를 자신의 말로 설명했습니다.",
        strengths: ["개념이해", "자기설명", "오답분석"],
        nextGoal: "양쪽에 미지수가 있는 방정식에서도 등식의 균형 원리를 적용해봅니다.",
        responseCount: 5,
        studentName: "김생각",
        gradeLabel: label,
        sample: true
      },
      {
        id: "sample-reading",
        date: daysAgo(5),
        grade,
        subject: "국어",
        topic: "주장과 근거 구분",
        title: "글의 핵심 근거를 찾아 설명했어요",
        summary: "글쓴이의 주장과 이를 뒷받침하는 근거를 구분하고, 근거가 충분한지 스스로 질문했습니다.",
        strengths: ["비판적 사고", "근거판단", "질문력"],
        nextGoal: "같은 주제에 대한 반대 의견의 근거도 비교해봅니다.",
        responseCount: 4,
        studentName: "김생각",
        gradeLabel: label,
        sample: true
      },
      {
        id: "sample-science",
        date: daysAgo(12),
        grade,
        subject: "과학",
        topic: "상태 변화",
        title: "관찰한 현상을 원인과 연결했어요",
        summary: "물이 끓을 때 생기는 기포를 단순한 공기라고 보지 않고, 관찰과 자료를 통해 수증기와 연결했습니다.",
        strengths: ["관찰력", "탐구력", "자기교정"],
        nextGoal: "증발과 끓음의 공통점과 차이점을 표로 정리해봅니다.",
        responseCount: 6,
        studentName: "김생각",
        gradeLabel: label,
        sample: true
      }
    ];
  }

  function getSession() {
    return read(KEYS.session, { role: "student", grade: "m2" });
  }

  function getGrowthRecords() {
    const session = getSession();
    const records = read(KEYS.growth, []);
    if (!Array.isArray(records) || records.length === 0) return sampleRecords(session.grade || "m2");
    return records.map((record) => ({
      studentName: "김생각",
      gradeLabel: gradeLabels[record.grade] || gradeLabels[session.grade] || gradeLabels.m2,
      ...record,
      sample: false
    }));
  }

  function getFeedbacks() {
    const feedbacks = read(KEYS.feedback, {});
    return feedbacks && typeof feedbacks === "object" ? feedbacks : {};
  }

  function saveFeedback(recordId, text, teacherName = "김생각 선생님") {
    const feedbacks = getFeedbacks();
    feedbacks[recordId] = {
      recordId,
      text: String(text || "").trim(),
      teacherName,
      status: "confirmed",
      confirmedAt: new Date().toISOString()
    };
    write(KEYS.feedback, feedbacks);
    return feedbacks[recordId];
  }

  function formatDate(value, withTime = false) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "날짜 정보 없음";
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {})
    }).format(date);
  }

  function competenceSummary(records) {
    const counts = {};
    records.forEach((record) => {
      (record.strengths || []).forEach((strength) => {
        counts[strength] = (counts[strength] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], index) => ({
        name,
        count,
        signal: Math.min(94, 48 + count * 12 + Math.max(0, 8 - index * 3))
      }));
  }

  function teacherDraft(record) {
    return `${record.studentName || "학생"}은(는) 이번 ${record.subject || "학습"} 활동에서 ${record.summary || "학습과정을 스스로 설명했습니다."} 특히 ${(record.strengths || []).join(", ")}의 변화가 확인됩니다. 다음 활동에서는 ${record.nextGoal || "배운 내용을 새로운 문제에 적용하도록 지도하겠습니다."}`;
  }

  function parentQuestions(record) {
    const topic = record.topic || "오늘 배운 내용";
    return [
      `오늘 ${topic}에서 처음에는 무엇이 가장 어려웠어?`,
      "도움을 받은 뒤 네 생각이 어떻게 달라졌어?",
      `다음 목표인 ‘${record.nextGoal || "새로운 문제에 적용하기"}’를 위해 집에서 무엇을 해볼까?`
    ];
  }

  window.TTAIStorage = {
    KEYS,
    gradeLabels,
    getSession,
    getGrowthRecords,
    getFeedbacks,
    saveFeedback,
    formatDate,
    competenceSummary,
    teacherDraft,
    parentQuestions
  };
})();
