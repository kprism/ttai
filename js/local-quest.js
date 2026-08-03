(() => {
  "use strict";

  const STAGE_PROMPTS = [
    {
      title: "문제를 처음 바라보기",
      question: "이 문제가 왜 문제라고 생각하나요? 누구에게 어떤 불편이나 위험이 생기는지 네 생각부터 적어보세요.",
      hint: "좋은 출발이에요. 아직 해결책을 서두르지 말고, 문제를 겪는 사람과 상황을 더 구체적으로 떠올려보세요.",
      key: "firstThought"
    },
    {
      title: "원인과 이해관계자 찾기",
      question: "문제가 생기는 원인을 한 가지로 단정하지 말고, 학생·학부모·운전자·주민·행정기관의 관점에서 각각 적어보세요.",
      hint: "여러 관점을 본 점이 좋아요. 서로 다른 입장이 충돌하는 지점을 표시하면 조사방향이 더 또렷해집니다.",
      key: "causes"
    },
    {
      title: "조사할 증거 정하기",
      question: "느낌이 아니라 근거로 설명하려면 무엇을 조사해야 할까요? 관찰, 인터뷰, 통계, 사진, 지도 가운데 필요한 자료를 정해보세요.",
      hint: "조사방법이 구체적일수록 대안의 설득력이 커져요. 시간·장소·대상·횟수도 함께 정해보세요.",
      key: "research"
    },
    {
      title: "실행 가능한 대안 만들기",
      question: "조사결과를 바탕으로 비용·효과·부작용을 고려한 대안을 적어보세요. 한 가지보다 여러 대안을 비교하면 더 좋아요.",
      hint: "대안의 방향이 보이기 시작했어요. 누가 실행하고, 어느 기간에, 어떤 자원이 필요한지도 붙여보세요.",
      key: "alternative"
    },
    {
      title: "시뮬레이션으로 미리 검토하기",
      question: "이 대안을 실제로 시행했다고 가정해보세요. 좋아지는 점, 예상하지 못한 부작용, 실패할 가능성을 각각 적어보세요.",
      hint: "실행 전 위험까지 생각한 점이 훌륭해요. 가장 나쁜 상황에서도 수정 가능한 안전장치를 한 가지 더 제안해보세요.",
      key: "simulation"
    }
  ];

  const RESOURCE_LIBRARY = [
    {
      id: "taas-gis",
      title: "교통사고 GIS 분석 시스템",
      organization: "한국도로교통공단 TAAS",
      url: "https://taas.koroad.or.kr/web/shp/sbm/initGisAnals.do?menuId=WEB_KMP_GIS_TAS",
      summary: "지역별 교통사고 위치, 어린이 사고다발지점과 보호구역 현황을 지도에서 살펴볼 수 있습니다.",
      keywords: ["교통사고", "지도", "스쿨존", "어린이", "횡단보도", "사고다발"],
      stages: ["firstThought", "causes", "research", "alternative", "simulation"]
    },
    {
      id: "taas-statistics",
      title: "교통사고 주요 통계",
      organization: "한국도로교통공단 TAAS",
      url: "https://taas.koroad.or.kr/sta/acs/gus/selectTfcacdOccrrncSttus.do?menuId=WEB_KMP_MIM",
      summary: "어린이 교통사고와 어린이보호구역 사고 등 공식 통계를 확인할 수 있습니다.",
      keywords: ["통계", "어린이", "교통사고", "보호구역", "근거", "수치"],
      stages: ["firstThought", "causes", "research", "alternative"]
    },
    {
      id: "child-taas",
      title: "어린이 TAAS 교통안전지도·보고서",
      organization: "한국도로교통공단",
      url: "https://taas.koroad.or.kr/childTaas/main.do",
      summary: "학생 눈높이에서 교통안전지도를 만들고 조사결과를 보고서로 정리할 수 있습니다.",
      keywords: ["학생", "교통안전지도", "보고서", "현장조사", "학교", "안전"],
      stages: ["research", "alternative", "simulation"]
    },
    {
      id: "school-zone-law",
      title: "어린이·노인 및 장애인 보호구역 지정·관리 규칙",
      organization: "국가법령정보센터",
      url: "https://www.law.go.kr/LSW/lsInfoP.do?ancYnChk=0&lsId=011331",
      summary: "보호구역 지정과 관리 시 조사해야 하는 통행량, 주차수요, 안전시설과 사고현황 등의 법적 기준을 확인할 수 있습니다.",
      keywords: ["법령", "보호구역", "주차", "통행량", "안전시설", "행정", "규칙"],
      stages: ["causes", "research", "alternative", "simulation"]
    }
  ];

  const DEFAULT_PEER_THOUGHTS = {
    firstThought: [
      { memberId: "student-2", name: "박탐구", avatar: "👩‍🎓", text: "횡단보도 가까이에 차가 서 있으면 운전자와 학생이 서로를 늦게 발견하는 것이 가장 위험하다고 생각해." },
      { memberId: "student-3", name: "이협력", avatar: "🧑‍🎓", text: "학생이 몰리는 등교시간과 일반 시간의 위험 정도가 다를 것 같아. 시간대를 나눠 봐야 해." },
      { memberId: "student-4", name: "최실천", avatar: "👩‍🎓", text: "불편하다는 느낌만 말하지 말고 실제로 위험했던 위치와 상황을 지도에 표시하면 좋겠어." }
    ],
    causes: [
      { memberId: "student-2", name: "박탐구", avatar: "👩‍🎓", text: "학부모 차량이 잠깐 정차할 공간이 부족해서 횡단보도 근처에 차가 몰리는 것 같아." },
      { memberId: "student-3", name: "이협력", avatar: "🧑‍🎓", text: "운전자에게 학교 앞이라는 표시가 잘 보이지 않거나 단속시간을 모르는 것도 원인일 수 있어." },
      { memberId: "student-4", name: "최실천", avatar: "👩‍🎓", text: "학생들이 정해진 통학로가 아닌 여러 방향으로 건너는 행동도 함께 살펴봐야 해." }
    ],
    research: [
      { memberId: "student-2", name: "박탐구", avatar: "👩‍🎓", text: "등교시간 30분 동안 불법주차 차량 수와 정차시간을 날짜별로 세어보자." },
      { memberId: "student-3", name: "이협력", avatar: "🧑‍🎓", text: "학생·학부모·운전자에게 각각 짧은 인터뷰를 해서 관점 차이를 비교하면 좋겠어." },
      { memberId: "student-4", name: "최실천", avatar: "👩‍🎓", text: "TAAS 지도에서 학교 주변 사고와 어린이 사고다발지점이 있는지 확인해보자." }
    ],
    alternative: [
      { memberId: "student-2", name: "박탐구", avatar: "👩‍🎓", text: "횡단보도 앞 시야확보 구역을 더 분명하게 표시하고 등교시간 집중단속을 함께 하면 좋겠어." },
      { memberId: "student-3", name: "이협력", avatar: "🧑‍🎓", text: "학부모 승하차 구역을 조금 떨어진 곳에 만들면 불법정차 원인을 줄일 수 있을 것 같아." },
      { memberId: "student-4", name: "최실천", avatar: "👩‍🎓", text: "학생이 직접 만든 안전지도를 학교와 시청에 공유하고 한 달 뒤 변화를 다시 조사하자." }
    ],
    simulation: [
      { memberId: "student-2", name: "박탐구", avatar: "👩‍🎓", text: "단속만 강화하면 차량이 골목으로 이동해 다른 위험이 생길 수 있어. 주변 도로도 함께 확인해야 해." },
      { memberId: "student-3", name: "이협력", avatar: "🧑‍🎓", text: "승하차 구역이 너무 멀면 이용하지 않을 수 있으니 이동거리와 안내방법을 시험해봐야 해." },
      { memberId: "student-4", name: "최실천", avatar: "👩‍🎓", text: "시범운영 전후의 차량 수와 학생 체감안전도를 같은 방법으로 조사하면 효과를 비교할 수 있어." }
    ]
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    })[character]);
  }

  function readRole() {
    const params = new URLSearchParams(window.location.search);
    const session = window.TTAIStorage.getSession();
    return {
      role: params.get("role") || session.role || "student",
      grade: params.get("grade") || session.grade || "m2"
    };
  }

  class LocalQuestApp {
    constructor() {
      this.session = readRole();
      this.quest = this.normalizeQuest(window.TTAIStorage.getLocalQuest());
      this.searchQuery = "";
      this.stream = null;
      this.cameraOn = false;
      this.micOn = true;
      window.TTAIStorage.saveLocalQuest(this.quest);
      this.bindEvents();
      this.render();
    }

    normalizeQuest(quest) {
      const team = Array.isArray(quest.team) ? quest.team : [];
      const validVoter = team.some((member) => member.id === quest.demoActiveVoterId)
        ? quest.demoActiveVoterId
        : (team[0]?.id || "student-1");
      return {
        ...quest,
        answers: quest.answers || {},
        votes: quest.votes || {},
        peerThoughts: quest.peerThoughts || DEFAULT_PEER_THOUGHTS,
        sourcesUsed: Array.isArray(quest.sourcesUsed) ? quest.sourcesUsed : [],
        demoActiveVoterId: validVoter
      };
    }

    save() {
      this.quest = window.TTAIStorage.saveLocalQuest(this.quest);
      this.render();
    }

    currentPrompt() {
      return this.quest.stage <= 4 ? STAGE_PROMPTS[this.quest.stage] : null;
    }

    bindEvents() {
      byId("saveTeacherSetup").addEventListener("click", () => this.saveTeacherSetup());
      byId("submitAnswer").addEventListener("click", () => this.submitStageAnswer());
      byId("confirmStageBtn").addEventListener("click", () => this.confirmStageAnswer());
      byId("materialSearchBtn").addEventListener("click", () => this.searchMaterials());
      byId("materialSearchInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this.searchMaterials();
        }
      });
      byId("materialSearchResults").addEventListener("click", (event) => {
        const link = event.target.closest("[data-source-id]");
        if (!link) return;
        this.recordSource(link.dataset.sourceId);
      });
      byId("voteMemberSelect").addEventListener("change", (event) => {
        this.quest.demoActiveVoterId = event.target.value;
        window.TTAIStorage.saveLocalQuest(this.quest);
        this.renderConsensus();
      });
      byId("agreeBtn").addEventListener("click", () => this.vote(true));
      byId("disagreeBtn").addEventListener("click", () => this.vote(false));
      byId("completeConsensusBtn").addEventListener("click", () => this.completeConsensusDemo());
      byId("startOfficialBtn").addEventListener("click", () => this.startOfficialDiscussion());
      byId("finishOfficialBtn").addEventListener("click", () => this.finishOfficialDiscussion());
      byId("saveMunicipalResult").addEventListener("click", () => this.saveMunicipalResult());
      byId("openMeetingBtn").addEventListener("click", () => this.openMeeting());
      byId("closeMeetingBtn").addEventListener("click", () => this.closeMeeting());
      byId("cameraBtn").addEventListener("click", () => this.toggleCamera());
      byId("micBtn").addEventListener("click", () => this.toggleMic());
      byId("resetQuestBtn").addEventListener("click", () => {
        if (window.confirm("로컬퀘스트 시연기록을 처음 상태로 되돌릴까요?")) {
          this.quest = this.normalizeQuest(window.TTAIStorage.resetLocalQuest());
          this.searchQuery = "";
          this.render();
        }
      });
      byId("guideBtn").addEventListener("click", () => {
        byId("guidePanel").hidden = !byId("guidePanel").hidden;
      });
      document.addEventListener("click", (event) => {
        if (!byId("guidePanel").hidden && !event.target.closest(".guide")) byId("guidePanel").hidden = true;
      });
    }

    render() {
      this.renderRole();
      this.renderHero();
      this.renderProgress();
      this.renderTeam();
      this.renderTeacherSetup();
      this.renderStudentWorkspace();
      this.renderConsensus();
      this.renderInstitution();
      this.renderOfficialDiscussion();
      this.renderMunicipalResult();
    }

    renderRole() {
      const labels = {
        student: "학생 프로젝트 화면",
        teacher: "교사 운영 화면",
        school: "학교 관리자 화면",
        district: "기관 담당자 화면",
        province: "교육청 담당자 화면",
        admin: "플랫폼 관리자 화면"
      };
      byId("roleBadge").textContent = labels[this.session.role] || labels.student;
      byId("teacherPanel").hidden = this.session.role !== "teacher" && this.session.role !== "admin";
      byId("studentPanel").hidden = this.session.role === "parent";
      byId("officerPanel").hidden = !["district", "province", "admin"].includes(this.session.role);
      byId("studentActions").hidden = this.session.role !== "student";
    }

    renderHero() {
      byId("questTitle").textContent = this.quest.title;
      byId("questTopic").textContent = this.quest.topic;
      byId("teacherConfirmState").textContent = this.quest.teacherConfirmed ? "선생님 최종확정 완료" : "선생님 확인 대기";
    }

    renderProgress() {
      const labels = this.quest.stageLabels || [];
      byId("stageList").innerHTML = labels.map((label, index) => {
        const state = index < this.quest.stage ? "done" : index === this.quest.stage ? "current" : "waiting";
        return '<li class="' + state + '"><span>' + (index + 1) + '</span><b>' + escapeHtml(label) + '</b></li>';
      }).join("");
      const percent = Math.round(((this.quest.stage + 1) / labels.length) * 100);
      byId("progressBar").style.width = Math.min(100, percent) + "%";
      byId("progressText").textContent = percent + "% 진행";
    }

    renderTeam() {
      byId("teamList").innerHTML = (this.quest.team || []).map((member) => {
        const leader = member.id === this.quest.leaderId;
        return '<article class="member"><div class="member-avatar">' + escapeHtml(member.avatar) + '</div><div><strong>' +
          escapeHtml(member.name) + (leader ? ' <em>팀리더</em>' : "") + '</strong><small>' + escapeHtml(member.role) +
          '</small></div></article>';
      }).join("");
    }

    renderTeacherSetup() {
      byId("teacherTopicInput").value = this.quest.topic;
      byId("leaderSelect").innerHTML = (this.quest.team || []).map((member) => (
        '<option value="' + escapeHtml(member.id) + '"' + (member.id === this.quest.leaderId ? " selected" : "") + '>' +
        escapeHtml(member.name) + '</option>'
      )).join("");
      byId("teacherSetupState").textContent = this.quest.teacherConfirmed
        ? "현재 주제와 팀리더가 학생 화면에 확정되어 있습니다."
        : "주제와 팀구성을 확인한 뒤 최종확정해 주세요.";
    }

    saveTeacherSetup() {
      this.quest.topic = byId("teacherTopicInput").value.trim() || this.quest.topic;
      this.quest.leaderId = byId("leaderSelect").value;
      this.quest.team = this.quest.team.map((member) => ({
        ...member,
        role: member.id === this.quest.leaderId ? "팀리더" : (member.role === "팀리더" ? "팀원" : member.role)
      }));
      this.quest.teacherConfirmed = true;
      this.save();
      this.toast("주제와 팀구성을 최종확정했습니다.");
    }

    renderStudentWorkspace() {
      const workspace = byId("aiWorkspace");
      const feedback = byId("aiFeedback");
      const confirmButton = byId("confirmStageBtn");
      const submitButton = byId("submitAnswer");
      const input = byId("answerInput");
      const peerWrap = byId("peerThoughtsWrap");
      const searchWrap = byId("materialSearchWrap");

      feedback.hidden = true;
      confirmButton.hidden = true;
      peerWrap.hidden = true;
      searchWrap.hidden = true;

      if (!this.quest.teacherConfirmed) {
        workspace.innerHTML = '<div class="empty">선생님이 주제와 팀구성을 최종확정하면 AI 프로젝트 안내가 시작됩니다.</div>';
        input.disabled = true;
        submitButton.disabled = true;
        return;
      }

      if (this.quest.stage <= 4) {
        const prompt = this.currentPrompt();
        const previous = this.quest.answers[prompt.key];
        const pending = this.quest.pendingReview;
        const waitingForConfirmation = Boolean(
          pending && pending.stage === this.quest.stage && pending.key === prompt.key
        );

        workspace.innerHTML = '<span class="ai-label">생각자국 AI 질문</span><h3>' + escapeHtml(prompt.title) + '</h3><p>' +
          escapeHtml(prompt.question) + '</p>' + (previous ? '<div class="saved-answer"><strong>내가 적은 생각</strong><p>' +
          escapeHtml(previous) + '</p></div>' : "");

        input.value = previous || "";
        input.disabled = this.session.role !== "student" || waitingForConfirmation;
        submitButton.disabled = this.session.role !== "student" || waitingForConfirmation;
        submitButton.textContent = waitingForConfirmation ? "AI 피드백 확인 중" : "생각 제출하고 AI 피드백 보기";

        if (waitingForConfirmation) {
          feedback.innerHTML = '<strong>✨ 좋은 생각이에요.</strong><p>' + escapeHtml(pending.hint || prompt.hint) +
            '</p><p class="review-note">피드백을 충분히 읽은 뒤 아래 확인 버튼을 누르면 다음 질문으로 넘어갑니다.</p>';
          feedback.hidden = false;
          confirmButton.hidden = this.session.role !== "student";
          byId("answerHint").textContent = "AI 피드백은 자동으로 사라지지 않습니다. 읽은 뒤 직접 확인해 주세요.";
        } else {
          byId("answerHint").textContent = "학생의 생각을 먼저 받고, AI는 칭찬과 작은 힌트를 보여줍니다. 확인 버튼을 눌러야 다음 단계로 넘어갑니다.";
        }

        peerWrap.hidden = false;
        searchWrap.hidden = false;
        this.renderPeerThoughts(prompt.key, Boolean(previous));
        this.renderSourceLibrary(prompt.key);
      } else {
        workspace.innerHTML = '<span class="ai-label">탐구 단계 완료</span><h3>이제 팀 합의와 기관 협력 단계입니다</h3><p>문제정의·원인·조사·대안·시뮬레이션 기록을 토대로 팀원 모두의 의견과 동의를 확인합니다.</p>';
        input.value = "";
        input.disabled = true;
        submitButton.disabled = true;
        submitButton.textContent = "탐구 단계 완료";
      }
    }

    renderPeerThoughts(stageKey, ownAnswerSubmitted) {
      const container = byId("peerThoughtCards");
      if (!ownAnswerSubmitted) {
        container.innerHTML = '<div class="peer-lock"><span>🔒</span><div><strong>내 생각을 먼저 남겨보세요</strong><p>다른 친구의 답을 따라 쓰지 않도록, 내 생각을 제출한 뒤 팀원의 생각이 열립니다.</p></div></div>';
        return;
      }

      const thoughts = this.quest.peerThoughts?.[stageKey] || [];
      container.innerHTML = thoughts.map((thought) => (
        '<article class="peer-card"><div class="peer-head"><span>' + escapeHtml(thought.avatar) + '</span><strong>' +
        escapeHtml(thought.name) + '</strong></div><p>' + escapeHtml(thought.text) + '</p></article>'
      )).join("") || '<p class="state-text">아직 이 단계에 친구가 남긴 생각이 없습니다.</p>';
    }

    searchMaterials() {
      this.searchQuery = byId("materialSearchInput").value.trim();
      const prompt = this.currentPrompt();
      if (!prompt) return;
      this.renderSourceLibrary(prompt.key);
    }

    renderSourceLibrary(stageKey) {
      const query = this.searchQuery.toLowerCase();
      byId("materialSearchInput").value = this.searchQuery;
      const resources = RESOURCE_LIBRARY.filter((source) => {
        const haystack = [source.title, source.organization, source.summary, ...source.keywords].join(" ").toLowerCase();
        const queryMatched = !query || query.split(/\s+/).every((word) => haystack.includes(word));
        return queryMatched && (source.stages.includes(stageKey) || Boolean(query));
      });

      const usedIds = new Set((this.quest.sourcesUsed || []).map((source) => source.id));
      byId("materialSearchResults").innerHTML = resources.length
        ? resources.map((source) => (
          '<article class="source-result"><div class="source-copy"><span>' + escapeHtml(source.organization) + '</span><strong>' +
          escapeHtml(source.title) + '</strong><p>' + escapeHtml(source.summary) + '</p></div><div class="source-actions">' +
          (usedIds.has(source.id) ? '<em>✓ 출처 저장됨</em>' : '') + '<a href="' + escapeHtml(source.url) +
          '" target="_blank" rel="noopener" data-source-id="' + escapeHtml(source.id) + '">자료 열기 ↗</a></div></article>'
        )).join("")
        : '<div class="search-empty">검색어와 맞는 자료가 없습니다. ‘교통사고’, ‘보호구역’, ‘통계’, ‘법령’을 검색해보세요.</div>';

      this.renderUsedSources("usedSourceList");
    }

    recordSource(sourceId) {
      const source = RESOURCE_LIBRARY.find((item) => item.id === sourceId);
      if (!source) return;
      const prompt = this.currentPrompt();
      const existing = (this.quest.sourcesUsed || []).find((item) => item.id === sourceId);
      if (existing) {
        existing.lastClickedAt = new Date().toISOString();
        existing.clickCount = (existing.clickCount || 1) + 1;
      } else {
        this.quest.sourcesUsed.push({
          id: source.id,
          title: source.title,
          organization: source.organization,
          url: source.url,
          summary: source.summary,
          stageKey: prompt?.key || "project",
          stageTitle: prompt?.title || "프로젝트",
          clickedAt: new Date().toISOString(),
          lastClickedAt: new Date().toISOString(),
          clickCount: 1
        });
      }
      window.TTAIStorage.saveLocalQuest(this.quest);
      if (prompt) this.renderSourceLibrary(prompt.key);
      this.toast("자료 링크가 대안의 출처로 자동 저장됐습니다.");
    }

    renderUsedSources(targetId) {
      const target = byId(targetId);
      if (!target) return;
      const sources = this.quest.sourcesUsed || [];
      target.innerHTML = sources.length
        ? '<strong class="used-title">📚 대안 출처로 저장된 자료</strong><div class="used-source-grid">' + sources.map((source, index) => (
          '<a href="' + escapeHtml(source.url) + '" target="_blank" rel="noopener"><span>[' + (index + 1) + '] ' +
          escapeHtml(source.organization) + '</span><b>' + escapeHtml(source.title) + '</b></a>'
        )).join("") + '</div>'
        : '<p class="source-guide">자료 링크를 열어 확인하면 이곳에 자동 저장되고, 최종대안의 출처로 연결됩니다.</p>';
    }

    submitStageAnswer() {
      if (this.quest.stage > 4 || this.quest.pendingReview) return;
      const text = byId("answerInput").value.trim();
      if (!text) {
        byId("answerInput").focus();
        return;
      }

      const prompt = this.currentPrompt();
      this.quest.answers[prompt.key] = text;
      if (prompt.key === "alternative") this.quest.proposal = text;
      if (prompt.key === "simulation") this.quest.simulation = text;
      this.quest.pendingReview = {
        stage: this.quest.stage,
        key: prompt.key,
        answer: text,
        hint: prompt.hint,
        createdAt: new Date().toISOString()
      };
      this.save();
      this.toast("AI 피드백과 친구들의 생각이 열렸습니다. 읽은 뒤 확인 버튼을 눌러주세요.");
    }

    confirmStageAnswer() {
      const pending = this.quest.pendingReview;
      if (!pending || pending.stage !== this.quest.stage) return;

      this.quest.stage = Math.min(5, this.quest.stage + 1);
      this.quest.pendingReview = null;
      this.searchQuery = "";
      this.save();
      this.toast(this.quest.stage >= 5 ? "탐구단계를 마쳤습니다. 이제 팀 합의를 진행합니다." : "확인했습니다. 다음 질문으로 넘어갑니다.");
    }

    renderConsensus() {
      const votes = this.quest.votes || {};
      const agreed = this.quest.team.filter((member) => votes[member.id]?.agree === true).length;
      const total = this.quest.team.length;
      const selectedId = this.quest.demoActiveVoterId || this.quest.team[0]?.id;
      const selectedVote = votes[selectedId] || { agree: null, comment: "" };

      byId("proposalText").textContent = this.quest.proposal;
      byId("simulationText").textContent = this.quest.simulation;
      byId("voteCount").textContent = agreed + '/' + total + '명 동의';
      byId("voteMemberSelect").innerHTML = this.quest.team.map((member) => (
        '<option value="' + escapeHtml(member.id) + '"' + (member.id === selectedId ? " selected" : "") + '>' +
        escapeHtml(member.name) + ' · ' + escapeHtml(member.role) + '</option>'
      )).join("");
      byId("voteComment").value = selectedVote.comment || "";
      byId("voteList").innerHTML = this.quest.team.map((member) => {
        const vote = votes[member.id] || { agree: null, comment: "" };
        const state = vote.agree === true ? "동의" : vote.agree === false ? "보완 요청" : "의견 대기";
        return '<article class="vote"><strong>' + escapeHtml(member.name) + '</strong><span class="vote-state ' +
          (vote.agree === true ? "yes" : vote.agree === false ? "no" : "wait") + '">' + state + '</span><p>' +
          escapeHtml(vote.comment || "아직 의견을 남기지 않았습니다.") + '</p></article>';
      }).join("");
      this.renderUsedSources("proposalSources");
      byId("consensusSection").hidden = this.quest.stage < 5;
      byId("completeConsensusBtn").hidden = !["teacher", "admin"].includes(this.session.role);
    }

    updateConsensusState() {
      const allAgreed = this.quest.team.length > 0 && this.quest.team.every((member) => this.quest.votes[member.id]?.agree === true);
      if (allAgreed) {
        this.quest.institution.disclosed = true;
        this.quest.stage = Math.max(this.quest.stage, 6);
      }
      return allAgreed;
    }

    vote(agree) {
      const voterId = byId("voteMemberSelect").value || this.quest.demoActiveVoterId;
      const comment = byId("voteComment").value.trim();
      this.quest.demoActiveVoterId = voterId;
      this.quest.votes[voterId] = {
        agree,
        comment: comment || (agree ? "현재 대안에 동의합니다." : "추가 보완이 필요합니다.")
      };

      const allAgreed = this.updateConsensusState();
      if (!allAgreed) {
        const nextWaiting = this.quest.team.find((member) => this.quest.votes[member.id]?.agree == null);
        if (nextWaiting) this.quest.demoActiveVoterId = nextWaiting.id;
      }
      this.save();
      this.toast(allAgreed ? "팀 전원 동의가 완료되어 기관 담당정보가 공개됐습니다." : "선택한 학생의 의견을 저장했습니다.");
    }

    completeConsensusDemo() {
      this.quest.team.forEach((member) => {
        if (!this.quest.votes[member.id]) this.quest.votes[member.id] = {};
        this.quest.votes[member.id].agree = true;
        if (!this.quest.votes[member.id].comment) this.quest.votes[member.id].comment = "토의 후 최종대안에 동의했습니다.";
      });
      this.updateConsensusState();
      this.save();
      this.toast("팀 전원 합의가 확인되어 기관 담당정보가 공개됐습니다.");
    }

    renderInstitution() {
      const visible = this.quest.institution.disclosed;
      byId("institutionSection").hidden = !visible;
      if (!visible) return;
      const institution = this.quest.institution;
      byId("institutionCard").innerHTML = '<h3>' + escapeHtml(institution.name) + '</h3><p>' + escapeHtml(institution.department) +
        '</p><dl><div><dt>담당자</dt><dd>' + escapeHtml(institution.officer) + '</dd></div><div><dt>연락처</dt><dd>' +
        escapeHtml(institution.phone) + '</dd></div><div><dt>이메일</dt><dd>' + escapeHtml(institution.email) + '</dd></div></dl>' +
        '<small>프로토타입의 연락처는 시연용 정보입니다. 실제 서비스에서는 교사와 팀리더에게만 공개됩니다.</small>';
      byId("startOfficialBtn").hidden = this.quest.officialDiscussion.started;
    }

    startOfficialDiscussion() {
      this.quest.officialDiscussion.started = true;
      this.quest.officialDiscussion.officerJoined = true;
      this.quest.stage = Math.max(this.quest.stage, 7);
      this.save();
      this.toast("담당자 참여 토의가 시작됐습니다.");
    }

    renderOfficialDiscussion() {
      const discussion = this.quest.officialDiscussion;
      byId("officialSection").hidden = !discussion.started;
      if (!discussion.started) return;
      byId("officialQuestions").innerHTML = discussion.aiQuestions.map((question, index) => (
        '<article><span>' + (index + 1) + '</span><p>' + escapeHtml(question) + '</p></article>'
      )).join("");
      byId("officialNotes").value = discussion.notes || "";
      byId("finishOfficialBtn").hidden = discussion.finished;
      byId("officialDone").hidden = !discussion.finished;
    }

    finishOfficialDiscussion() {
      this.quest.officialDiscussion.notes = byId("officialNotes").value.trim();
      this.quest.officialDiscussion.finished = true;
      this.quest.stage = Math.max(this.quest.stage, 8);
      this.save();
      this.toast("담당자 참여 토의가 종결되고 결과 입력단계로 넘어갔습니다.");
    }

    renderMunicipalResult() {
      const result = this.quest.municipalResult;
      byId("resultStatus").value = result.status || "검토 전";
      byId("resultText").value = result.text || "";
      byId("resultOfficer").value = result.officerName || "";
      byId("resultPublic").innerHTML = result.text
        ? '<strong>🏛️ ' + escapeHtml(result.status) + '</strong><p>' + escapeHtml(result.text) + '</p><small>' +
          escapeHtml(result.officerName || this.quest.institution.officer) + ' · ' + escapeHtml(window.TTAIStorage.formatDate(result.updatedAt)) + '</small>'
        : '<strong>시정 반영결과 대기</strong><p>담당기관이 검토결과를 입력하면 학생·교사·학부모 화면에 공식 결과가 표시됩니다.</p>';
    }

    saveMunicipalResult() {
      this.quest.municipalResult = {
        status: byId("resultStatus").value,
        text: byId("resultText").value.trim(),
        officerName: byId("resultOfficer").value.trim() || this.quest.institution.officer,
        updatedAt: new Date().toISOString()
      };
      this.quest.stage = 8;
      this.save();
      this.toast("시정 반영결과를 공식 기록으로 저장했습니다.");
    }

    async openMeeting() {
      byId("meetingModal").hidden = false;
      this.quest.meeting.lastOpenedAt = new Date().toISOString();
      window.TTAIStorage.saveLocalQuest(this.quest);
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        byId("localVideo").srcObject = this.stream;
        this.cameraOn = true;
        this.micOn = true;
        this.updateMeetingButtons();
      } catch (error) {
        byId("meetingStatus").textContent = "카메라·마이크 권한을 허용하지 않아 아바타 시연 모드로 열었습니다.";
      }
    }

    closeMeeting() {
      if (this.stream) this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
      this.cameraOn = false;
      byId("meetingModal").hidden = true;
    }

    toggleCamera() {
      if (!this.stream) return;
      this.cameraOn = !this.cameraOn;
      this.stream.getVideoTracks().forEach((track) => { track.enabled = this.cameraOn; });
      this.updateMeetingButtons();
    }

    toggleMic() {
      if (!this.stream) return;
      this.micOn = !this.micOn;
      this.stream.getAudioTracks().forEach((track) => { track.enabled = this.micOn; });
      this.updateMeetingButtons();
    }

    updateMeetingButtons() {
      byId("cameraBtn").textContent = this.cameraOn ? "📷 카메라 끄기" : "🚫 카메라 켜기";
      byId("micBtn").textContent = this.micOn ? "🎙️ 음소거" : "🔇 마이크 켜기";
      byId("meetingStatus").textContent = "시연용 회의실입니다. 내 카메라 화면과 팀 참가자 UI를 확인할 수 있습니다.";
    }

    toast(message) {
      const toast = byId("toast");
      toast.textContent = message;
      toast.hidden = false;
      window.setTimeout(() => { toast.hidden = true; }, 2800);
    }
  }

  function init() {
    if (!window.TTAIStorage) {
      console.error("로컬퀘스트: 저장 모듈을 불러오지 못했습니다.");
      return;
    }
    new LocalQuestApp();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
