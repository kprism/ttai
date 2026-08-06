(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);

  function getSessionFromPage() {
    const params = new URLSearchParams(window.location.search);
    const stored = window.TTAIStorage.getSession() || {};
    const session = {
      role: params.get("role") || stored.role || "student",
      grade: params.get("grade") || stored.grade || "m2"
    };
    localStorage.setItem("ttai_demo_session", JSON.stringify(session));
    return session;
  }

  function metric(label, value, note) {
    return { label, value, note };
  }

  function initDashboard() {
    if (!window.TTAIStorage) {
      console.error("TTAIStorage 모듈을 불러오지 못했습니다.");
      return;
    }

    const session = getSessionFromPage();
    const records = window.TTAIStorage.getGrowthRecords();
    const feedbacks = window.TTAIStorage.getFeedbacks();
    const quest = window.TTAIStorage.getLocalQuest();
    const confirmedCount = records.filter((record) => feedbacks[record.id]?.status === "confirmed").length;
    const latest = records[0] || {};
    const questStage = quest.stageLabels?.[quest.stage] || "프로젝트 준비";

    const roleNames = {
      student: "학생",
      teacher: "선생님",
      parent: "학부모",
      school: "학교 관리자",
      district: "교육지원청 담당자",
      province: "시·도교육청 담당자",
      admin: "플랫폼 관리자"
    };

    const configs = {
      student: {
        avatar: "🧑‍🎓",
        name: (window.TTAIStorage.gradeLabels[session.grade] || "학생") + " 데모",
        title: "오늘의 학습과 성장 흐름을 확인해보자.",
        desc: "학습, 질문, 교사 피드백, 진로와 프로젝트가 자연스럽게 이어집니다.",
        tags: ["학년 맞춤 안내", "성장과정 기록", "자기주도 학습"],
        statusTitle: "오늘 학습현황",
        statusDesc: "최근 학습과 프로젝트 진행상태입니다.",
        metrics: [
          metric("성장활동", records.length + "개", "생각스튜디오 기록"),
          metric("교사 피드백", confirmedCount + "개", "확인된 피드백"),
          metric("최근 학습", latest.subject || "수학", latest.topic || "개념 이해"),
          metric("로컬퀘스트", window.TTAIStorage.isLocalQuestEligible(session.grade) ? questStage : "중2부터", "지역 프로젝트")
        ],
        cta: ["💡 생각스튜디오 시작 →", "./services/think-studio.html"]
      },
      teacher: {
        avatar: "👩‍🏫",
        name: "김생각 선생님",
        title: "학생의 학습과 프로젝트를 한 흐름으로 지원합니다.",
        desc: "학생 활동을 확인하고 AI 피드백 초안, 팀 프로젝트와 학부모 소통을 관리합니다.",
        tags: ["교사 확인형 AI", "학생 성장", "프로젝트 운영"],
        statusTitle: "오늘 지도현황",
        statusDesc: "검토할 학생 활동과 프로젝트 상태입니다.",
        metrics: [
          metric("검토할 활동", records.length + "건", "최근 학습기록"),
          metric("확인 완료", confirmedCount + "건", "공식 피드백"),
          metric("로컬퀘스트", questStage, quest.title),
          metric("예상 절감", "38분", "요약·초안 작성")
        ],
        cta: ["🧑‍🏫 교사 코파일럿 열기 →", "./services/teacher-copilot.html"]
      },
      parent: {
        avatar: "👨‍👩‍👧",
        name: "이성장 학부모",
        title: "점수가 아니라 자녀의 변화를 확인합니다.",
        desc: "교사가 확인한 성장과 가정에서 이어갈 대화를 확인합니다.",
        tags: ["비교 없는 리포트", "가정 대화", "교사 확인"],
        statusTitle: "자녀 성장현황",
        statusDesc: "최근 학습과 확인된 피드백입니다.",
        metrics: [
          metric("성장소식", records.length + "개", "최근 학습활동"),
          metric("교사 확인", confirmedCount ? "완료" : "대기", "AI 초안과 구분"),
          metric("최근 관심", latest.subject || "수학", "최근 활동"),
          metric("지역 프로젝트", questStage, "공개 가능한 정보")
        ],
        cta: ["💚 성장리포트 보기 →", "./services/parent-growth-report.html"]
      },
      school: {
        avatar: "🏫", name: "박미래 관리자", title: "학교 전체의 활용과 프로젝트를 관리합니다.",
        desc: "학생·교사 이용현황, 피드백과 로컬퀘스트 운영을 확인합니다.", tags: ["학교 통합관리", "권한", "프로젝트"],
        statusTitle: "학교 운영현황", statusDesc: "활성 사용자와 프로젝트 상태입니다.",
        metrics: [metric("활성 학생","583명","전체의 87%"),metric("활성 교사","42명","전체의 91%"),metric("피드백 확인률","84%","교사 검토"),metric("로컬퀘스트",questStage,quest.title)],
        cta: ["🗺️ 로컬퀘스트 운영 →", "./services/local-quest.html?role=school"]
      },
      district: {
        avatar: "🗺️", name: "최지원 담당자", title: "관할 학교의 성장과 지역 프로젝트를 연결합니다.",
        desc: "학교별 활용성과와 학생 제안의 기관 협력결과를 확인합니다.", tags: ["지역 통합", "학생 정책참여", "성과관리"],
        statusTitle: "지원청 운영현황", statusDesc: "학교 활용과 기관 협력상태입니다.",
        metrics: [metric("참여 학교","38교","초 24 · 중 14"),metric("활성 학생","18,420명","월간 기준"),metric("로컬퀘스트",questStage,quest.title),metric("시정 검토",quest.municipalResult?.status||"검토 전","담당기관 결과")],
        cta: ["🏛️ 프로젝트 결과 입력 →", "./services/local-quest.html?role=district"]
      },
      province: {
        avatar: "🏛️", name: "정정책 담당자", title: "도 단위 교육성과와 지역 프로젝트를 확인합니다.",
        desc: "교육지원청별 활용성과, AI 안전과 지역 프로젝트 결과를 확인합니다.", tags: ["도 단위 통합", "정책성과", "AI 안전"],
        statusTitle: "교육청 정책현황", statusDesc: "지원청별 활용과 프로젝트 상태입니다.",
        metrics: [metric("참여 지원청","6곳","단계적 확산"),metric("활성 학생","104,379명","초·중·고"),metric("교사 확인률","86%","AI 초안 검토"),metric("지역 프로젝트",questStage,"기관 협력형")],
        cta: ["🗺️ 프로젝트 성과 보기 →", "./services/local-quest.html?role=province"]
      },
      admin: {
        avatar: "⚙️", name: "생각자국 운영자", title: "전체 기관과 AI 정책을 안전하게 운영합니다.",
        desc: "회원기관, 접근권한, 서비스 상태와 AI 정책을 관리합니다.", tags: ["멀티테넌트", "감사로그", "AI 정책"],
        statusTitle: "플랫폼 운영현황", statusDesc: "기관과 서비스 상태입니다.",
        metrics: [metric("회원기관","6곳","교육지원청 기준"),metric("등록 사용자","104,962명","전체 사용자"),metric("활성 서비스","7개","시연 서비스"),metric("시스템 상태","정상","중대장애 없음")],
        cta: ["🗺️ 전체 흐름 점검 →", "./services/local-quest.html?role=admin"]
      }
    };

    const config = configs[session.role] || configs.student;
    byId("avatar").textContent = config.avatar;
    byId("userName").textContent = config.name;
    byId("roleName").textContent = roleNames[session.role] || "학생";
    byId("heroTitle").textContent = config.title;
    byId("heroDesc").textContent = config.desc;
    byId("heroTags").innerHTML = config.tags.map((tag) => "<span>" + tag + "</span>").join("");
    byId("statusTitle").textContent = config.statusTitle;
    byId("statusDesc").textContent = config.statusDesc;
    byId("metrics").innerHTML = config.metrics.map((item) => (
      '<article class="metric"><small>' + item.label + '</small><strong>' + item.value + '</strong><span>' + item.note + '</span></article>'
    )).join("");

    const cta = byId("primaryCta");
    cta.textContent = config.cta[0];
    cta.href = config.cta[1];

    const catalog = {
      socratic: { icon:"🔎", title:"소크라테스 질문학교", desc:"여섯 가지 질문 렌즈를 배우고 직접 질문을 훈련합니다.", href:"./services/socratic-question-school.html?role="+encodeURIComponent(session.role)+"&grade="+encodeURIComponent(session.grade) },
      think: { icon:"💡", title:"생각스튜디오", desc:"질문과 오답을 단계별로 탐구합니다.", href:"./services/think-studio.html" },
      growth: { icon:"🧭", title:"성장나침반", desc:"학습과 생각의 변화를 확인합니다.", href:"./services/growth-compass.html" },
      quest: { icon:"🗺️", title:"로컬퀘스트", desc:"지역문제를 팀으로 조사하고 해결합니다.", href:"./services/local-quest.html?role="+encodeURIComponent(session.role)+"&grade="+encodeURIComponent(session.grade) },
      career: { icon:"🚀", title:"진로성장 AI", desc:"경험을 진로가설과 다음 활동으로 연결합니다.", href:"./services/career-growth-ai.html" },
      teacher: { icon:"🧑‍🏫", title:"교사 코파일럿", desc:"학생 활동요약과 피드백 초안을 검토합니다.", href:"./services/teacher-copilot.html" },
      parent: { icon:"💚", title:"학부모 성장리포트", desc:"확인된 변화와 가정 대화를 안내합니다.", href:"./services/parent-growth-report.html" }
    };

    const visibleByRole = {
      student: window.TTAIStorage.isLocalQuestEligible(session.grade) ? ["socratic","think","growth","quest","career"] : ["socratic","think","growth","career"],
      teacher: ["socratic","think","growth","quest","career","teacher","parent"],
      parent: ["socratic","growth","parent"],
      school: ["socratic","growth","quest","teacher","parent"],
      district: ["growth","quest"],
      province: ["growth","quest"],
      admin: ["socratic","think","growth","quest","career","teacher","parent"]
    };

    const visibleKeys = visibleByRole[session.role] || visibleByRole.student;
    const services = byId("services");
    services.replaceChildren();
    visibleKeys.forEach((key) => {
      const item = catalog[key];
      const card = document.createElement("a");
      card.className = "service";
      card.href = item.href;
      card.innerHTML = '<div class="sicon">' + item.icon + '</div><h3>' + item.title + '</h3><p>' + item.desc + '</p><footer>화면 열기 →</footer>';
      services.appendChild(card);
    });

    byId("connectionNotes").hidden = session.role === "student";
    byId("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("ttai_demo_session");
      window.location.href = "./login.html";
    });

    const helpBtn = byId("helpBtn");
    const helpPanel = byId("helpPanel");
    helpBtn.addEventListener("click", () => { helpPanel.hidden = !helpPanel.hidden; });
    document.addEventListener("click", (event) => {
      if (!helpPanel.hidden && !event.target.closest(".help")) helpPanel.hidden = true;
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initDashboard);
  else initDashboard();
})();
