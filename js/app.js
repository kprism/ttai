(() => {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function getSessionFromPage() {
    const params = new URLSearchParams(window.location.search);
    const stored = window.TTAIStorage.getSession() || {};
    const role = params.get("role") || stored.role || "student";
    const grade = params.get("grade") || stored.grade || "m2";
    const session = { role, grade };
    localStorage.setItem("ttai_demo_session", JSON.stringify(session));
    return session;
  }

  function metric(label, value, note) {
    return [label, value, note];
  }

  function initDashboard() {
    if (!window.TTAIStorage) {
      console.error("TTAIStorage 모듈을 불러오지 못했습니다.");
      return;
    }

    const session = getSessionFromPage();
    const records = window.TTAIStorage.getGrowthRecords();
    const feedbacks = window.TTAIStorage.getFeedbacks();
    const roleNames = {
      student: "학생",
      teacher: "선생님",
      parent: "학부모",
      school: "학교 관리자",
      district: "교육지원청 담당자",
      province: "시·도교육청 담당자",
      admin: "플랫폼 관리자"
    };
    const greetings = {
      e1: "오늘은 무엇이 궁금해? 놀이처럼 하나씩 해보자!",
      e2: "모르는 것은 부끄러운 게 아니야. 오늘도 한 걸음 자라보자!",
      e3: "네 생각에는 멋진 단서가 숨어 있어. 같이 찾아보자!",
      e4: "정답보다 생각한 과정이 더 중요해. 오늘의 단서를 찾아보자!",
      e5: "배운 내용을 다른 문제에도 쓸 수 있는지 확인해보자.",
      e6: "중학교로 이어질 튼튼한 생각의 기초를 만들어보자.",
      m1: "규칙을 외우는 데서 멈추지 말고 왜 그런지 이해해보자.",
      m2: "틀린 답은 실패가 아니라 다음 성장을 알려주는 자료야.",
      m3: "고등 학습으로 이어질 자기주도 학습방법을 만들어보자.",
      h1: "정답보다 재사용할 수 있는 사고방법을 남겨보세요.",
      h2: "문제의 겉모습이 아니라 내부 구조를 읽는 힘을 길러보세요.",
      h3: "입시 이후에도 남는 학습전략과 사고력을 완성해보세요."
    };

    const confirmedCount = records.filter((record) => {
      const feedback = feedbacks[record.id];
      return feedback && feedback.status === "confirmed";
    }).length;
    const latest = records[0] || {};

    const configs = {
      student: {
        avatar: "🧑‍🎓",
        name: (window.TTAIStorage.gradeLabels[session.grade] || "학생") + " 데모",
        title: greetings[session.grade] || greetings.m2,
        desc: "학습, 질문, 교사 피드백, 진로와 프로젝트가 하나의 성장 흐름으로 이어집니다.",
        tags: ["학년 맞춤 안내", "과목 자동 연결", "성장과정 기록"],
        metrics: [
          metric("연결된 성장활동", records.length + "개", "생각스튜디오 학습기록"),
          metric("교사 확인 피드백", confirmedCount + "개", "확인된 피드백만 표시"),
          metric("최근 학습", latest.subject || "수학", latest.topic || "개념 이해"),
          metric("다음 목표", "1개", "스스로 이어갈 학습")
        ],
        cta: ["💡 생각스튜디오 시작 →", "./services/think-studio.html"]
      },
      teacher: {
        avatar: "👩‍🏫",
        name: "김생각 선생님",
        title: "학생의 답보다 생각의 변화를 살펴봅니다",
        desc: "AI 초안을 검토하고 수업 맥락을 반영한 뒤 학생과 학부모에게 피드백을 전달합니다.",
        tags: ["AI 초안 교사 검토", "학급 변화", "업무시간 절감"],
        metrics: [
          metric("검토할 활동", records.length + "건", "최근 학습기록"),
          metric("확인 완료", confirmedCount + "건", "전달한 공식 피드백"),
          metric("도움 필요", "1명", "반복 오개념 감지"),
          metric("예상 절감", "38분", "요약·초안 작성 기준")
        ],
        cta: ["🧑‍🏫 교사 코파일럿 열기 →", "./services/teacher-copilot.html"]
      },
      parent: {
        avatar: "👨‍👩‍👧",
        name: "이성장 학부모",
        title: "점수가 아니라 자녀의 변화를 함께 봅니다",
        desc: "최근 관심, 도전, 교사 확인 피드백과 가정에서 도울 수 있는 대화를 확인합니다.",
        tags: ["비교 없는 리포트", "가정 대화", "교사 확인 정보"],
        metrics: [
          metric("새 성장소식", records.length + "개", "최근 학습활동"),
          metric("교사 확인", confirmedCount ? "완료" : "대기", "AI 초안과 구분"),
          metric("최근 관심", latest.subject || "수학", "가장 최근 활동"),
          metric("함께할 질문", "3개", "자녀와 나눌 대화")
        ],
        cta: ["💚 학부모 성장리포트 보기 →", "./services/parent-growth-report.html"]
      },
      school: {
        avatar: "🏫",
        name: "박미래 관리자",
        title: "학교 전체의 사용과 성장을 한눈에 봅니다",
        desc: "학급별 참여, 교사 활용, 피드백 확인과 프로젝트 운영을 관리합니다.",
        tags: ["학교 통합관리", "권한·동의", "활용현황"],
        metrics: [
          metric("활성 학생", "583명", "전체의 87%"),
          metric("활성 교사", "42명", "전체의 91%"),
          metric("피드백 확인률", "84%", "교사 검토 기준"),
          metric("지원 요청", "3건", "처리 대기")
        ],
        cta: ["🧑‍🏫 교사 지원 흐름 미리보기 →", "./services/teacher-copilot.html"]
      },
      district: {
        avatar: "🗺️",
        name: "최지원 담당자",
        title: "지역의 초·중학교 성장을 연결합니다",
        desc: "관할 학교의 도입, 활용, 교사업무 개선과 지역 단위 성장지표를 확인합니다.",
        tags: ["지역 통합", "초·중 연계", "교사 지원"],
        metrics: [
          metric("참여 학교", "38교", "초 24 · 중 14"),
          metric("활성 학생", "18,420명", "월간 기준"),
          metric("교사 업무개선", "18%", "자료작성 시간"),
          metric("확인 피드백", "8,924건", "누적 시연 지표")
        ],
        cta: ["🧭 학생 성장 흐름 미리보기 →", "./services/growth-compass.html"]
      },
      province: {
        avatar: "🏛️",
        name: "정정책 담당자",
        title: "초·중·고를 잇는 도 단위 교육정책을 봅니다",
        desc: "교육지원청별 활용성과, AI 안전, 교사 확인체계와 장기 성장지표를 확인합니다.",
        tags: ["도 단위 통합", "정책성과", "AI 안전·보안"],
        metrics: [
          metric("참여 지원청", "6곳", "단계적 확산"),
          metric("활성 학생", "104,379명", "초·중·고 합계"),
          metric("교사 확인률", "86%", "AI 초안 검토"),
          metric("보안 이상", "0건", "중대사고 기준")
        ],
        cta: ["🧭 학생 성장 흐름 미리보기 →", "./services/growth-compass.html"]
      },
      admin: {
        avatar: "⚙️",
        name: "생각자국 운영자",
        title: "전체 기관과 AI 정책을 안전하게 운영합니다",
        desc: "회원기관, 서비스 상태, 접근권한과 교사 확인형 AI 정책을 관리합니다.",
        tags: ["멀티테넌트", "감사로그", "AI 정책"],
        metrics: [
          metric("회원기관", "6곳", "교육지원청 기준"),
          metric("등록 사용자", "104,962명", "학생·교사·관리자"),
          metric("활성 서비스", "4개", "현재 시연 가능"),
          metric("시스템 상태", "정상", "중대장애 없음")
        ],
        cta: ["🧑‍🏫 교사 확인 흐름 점검 →", "./services/teacher-copilot.html"]
      }
    };

    const config = configs[session.role] || configs.student;
    byId("avatar").textContent = config.avatar;
    byId("userName").textContent = config.name;
    byId("roleName").textContent = roleNames[session.role] || "학생";
    byId("heroTitle").textContent = config.title;
    byId("heroDesc").textContent = config.desc;
    byId("heroTags").innerHTML = config.tags.map((tag) => "<span>" + tag + "</span>").join("");
    byId("metrics").innerHTML = config.metrics.map((item) => (
      '<article class="metric"><small>' + item[0] + '</small><strong>' + item[1] + '</strong><span>' + item[2] + '</span></article>'
    )).join("");

    const cta = byId("primaryCta");
    cta.textContent = config.cta[0];
    cta.href = config.cta[1];

    const permissions = {
      student: ["think", "growth"],
      teacher: ["think", "growth", "teacher"],
      parent: ["growth", "parent"],
      school: ["growth", "teacher", "parent"],
      district: ["growth", "teacher", "parent"],
      province: ["growth", "teacher", "parent"],
      admin: ["think", "growth", "teacher", "parent"]
    };
    const allowed = permissions[session.role] || permissions.student;
    const items = [
      { key: "think", icon: "💡", title: "생각스튜디오", desc: "학습 질문, 오답 진단, 단계별 힌트, 자기설명과 새 문제 적용을 지원합니다.", href: "./services/think-studio.html" },
      { key: "growth", icon: "🧭", title: "성장나침반", desc: "질문·도전·피드백·성찰이 어떻게 달라졌는지 구체적인 변화 문장으로 보여줍니다.", href: "./services/growth-compass.html" },
      { key: "career", icon: "🚀", title: "진로성장 AI", desc: "실제 활동과 관심 변화를 바탕으로 진로가설과 다음 경험을 제안합니다." },
      { key: "quest", icon: "🗺️", title: "로컬퀘스트", desc: "학교와 지역의 실제 문제를 조사하고 협력해 해결안으로 만드는 프로젝트 공간입니다." },
      { key: "teacher", icon: "🧑‍🏫", title: "교사 코파일럿", desc: "학생 활동을 요약하고 피드백 초안을 제공하되 최종 판단은 교사가 수행합니다.", href: "./services/teacher-copilot.html" },
      { key: "parent", icon: "💚", title: "학부모 성장리포트", desc: "점수 비교 없이 자녀의 변화와 교사 확인 피드백, 가정의 지원방법을 안내합니다.", href: "./services/parent-growth-report.html" }
    ];

    const services = byId("services");
    services.replaceChildren();
    items.forEach((item) => {
      const active = allowed.includes(item.key) && Boolean(item.href);
      const card = document.createElement(active ? "a" : "article");
      card.className = "service " + (active ? "active" : "disabled");
      if (active) card.href = item.href;
      card.innerHTML = '<span class="state">' + (active ? "시연 가능" : "다음 단계") + '</span>' +
        '<div class="sicon">' + item.icon + '</div>' +
        '<h3>' + item.title + '</h3>' +
        '<p>' + item.desc + '</p>' +
        '<footer>' + (active ? "클릭하여 화면 열기 →" : "기능 구조 설계 완료") + '</footer>';
      services.appendChild(card);
    });

    byId("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("ttai_demo_session");
      window.location.href = "./login.html";
    });

    const helpBtn = byId("helpBtn");
    const helpPanel = byId("helpPanel");
    helpBtn.addEventListener("click", () => {
      helpPanel.hidden = !helpPanel.hidden;
    });
    document.addEventListener("click", (event) => {
      if (!helpPanel.hidden && !event.target.closest(".help")) helpPanel.hidden = true;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDashboard);
  } else {
    initDashboard();
  }
})();
