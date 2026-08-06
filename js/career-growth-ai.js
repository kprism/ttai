(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);

  const JOBS = [
    {
      id: "urban-planner",
      icon: "🏙️",
      name: "도시계획가",
      group: "도시·교통·공공정책",
      description: "도시의 토지이용, 교통, 주거, 환경과 안전 문제를 조사하고 주민과 행정기관의 의견을 반영해 도시계획과 지역개발 대안을 설계합니다.",
      salary: "연 3,800만~5,500만원 참고",
      salaryNote: "도시계획·건설 관련 직업군의 공개 임금정보를 바탕으로 한 프로토타입 참고 범위",
      recognition: "높음",
      recognitionNote: "도시개발·교통·재생사업을 통해 시민 생활과 직접 연결되는 전문직",
      majors: ["도시공학", "도시계획", "교통공학", "지역개발", "건축학"],
      skills: ["문제정의", "공간적 사고", "이해관계자 조정", "자료조사", "대안설계"],
      weights: { public: 10, spatial: 10, inquiry: 7, leadership: 6, data: 5, communication: 6, reflection: 4 },
      links: {
        public: "https://www.career.go.kr/cloud/m/job/view?seq=10004",
        blog: "https://search.naver.com/search.naver?where=blog&query=%EB%8F%84%EC%8B%9C%EA%B3%84%ED%9A%8D%EA%B0%80+%EC%A7%81%EC%97%85+%EC%B2%B4%ED%97%98",
        video: "https://www.youtube.com/results?search_query=%EB%8F%84%EC%8B%9C%EA%B3%84%ED%9A%8D%EA%B0%80+%EC%A7%81%EC%97%85+%EC%9D%B8%ED%84%B0%EB%B7%B0"
      },
      experience: "학교 주변 보행안전지도를 만들고 교통·주차·횡단보도 개선안을 1쪽 정책제안서로 작성해보세요."
    },
    {
      id: "data-analyst",
      icon: "📊",
      name: "빅데이터 분석가",
      group: "데이터·AI·통계",
      description: "많은 데이터를 수집·정리·분석하고 시각화해 사람의 행동, 사회 변화와 문제 해결에 도움이 되는 근거를 제공합니다.",
      salary: "평균 4,455만원",
      salaryNote: "커리어넷·워크넷 빅데이터분석가 직업정보(2021) 중앙값",
      recognition: "높음",
      recognitionNote: "산업·금융·정부·공공 분야에서 수요가 확대되는 데이터 전문직",
      majors: ["통계학", "컴퓨터공학", "데이터사이언스", "산업공학", "경영정보"],
      skills: ["수리·논리", "자료정리", "패턴발견", "시각화", "근거판단"],
      weights: { data: 11, logic: 9, inquiry: 8, reflection: 5, public: 4, leadership: 3, communication: 4 },
      links: {
        public: "https://www.career.go.kr/cloud/m/job/view?seq=10032",
        blog: "https://search.naver.com/search.naver?where=blog&query=%EB%B9%85%EB%8D%B0%EC%9D%B4%ED%84%B0+%EB%B6%84%EC%84%9D%EA%B0%80+%EC%A7%81%EB%AC%B4+%EC%B2%B4%ED%97%98",
        video: "https://www.youtube.com/results?search_query=%EB%B9%85%EB%8D%B0%EC%9D%B4%ED%84%B0+%EB%B6%84%EC%84%9D%EA%B0%80+%EC%A7%81%EC%97%85+%EC%9D%B8%ED%84%B0%EB%B7%B0"
      },
      experience: "로컬퀘스트에서 찾은 교통사고·불법주차 자료를 표로 만들고, 가장 중요한 수치 3개를 그래프로 설명해보세요."
    },
    {
      id: "policy-researcher",
      icon: "🏛️",
      name: "정책연구원",
      group: "사회조사·행정·정책",
      description: "사회문제와 시민 요구를 조사하고 법·예산·효과를 분석해 정부, 지방자치단체와 공공기관의 정책 대안을 연구합니다.",
      salary: "연 4,000만~6,000만원 참고",
      salaryNote: "연구기관·공공기관의 사회과학 연구직 관련 공개 임금정보를 바탕으로 한 참고 범위",
      recognition: "중상",
      recognitionNote: "대중 노출은 직군별로 다르지만 공공정책 결정과 사회 변화에 미치는 영향이 큼",
      majors: ["행정학", "정책학", "사회학", "경제학", "법학"],
      skills: ["사회문제 분석", "인터뷰", "논증", "보고서 작성", "정책평가"],
      weights: { public: 10, inquiry: 9, communication: 8, reflection: 7, leadership: 5, data: 5, logic: 6 },
      links: {
        public: "https://www.work.go.kr/consltJobCarpa/srch/jobInfoSrch/srchJobInfo.do?cond=key",
        blog: "https://search.naver.com/search.naver?where=blog&query=%EC%A0%95%EC%B1%85%EC%97%B0%EA%B5%AC%EC%9B%90+%EC%A7%81%EB%AC%B4+%EC%9D%B8%ED%84%B0%EB%B7%B0",
        video: "https://www.youtube.com/results?search_query=%EC%A0%95%EC%B1%85%EC%97%B0%EA%B5%AC%EC%9B%90+%EC%A7%81%EC%97%85+%EC%9D%B8%ED%84%B0%EB%B7%B0"
      },
      experience: "학생·학부모·운전자·행정기관의 입장을 각각 정리하고, 대안의 장점·비용·부작용을 비교한 정책메모를 작성해보세요."
    },
    {
      id: "ai-engineer",
      icon: "🤖",
      name: "인공지능 엔지니어",
      group: "AI·소프트웨어",
      description: "데이터를 기반으로 인식·추론·예측하는 AI 모델을 설계하고 학습시키며, 성능을 평가하고 실제 서비스에 적용합니다.",
      salary: "5,000만원 이상 직업군",
      salaryNote: "커리어넷 2026 AI 직업 콘텐츠의 공개 안내 범주",
      recognition: "매우 높음",
      recognitionNote: "AI 기술 확산으로 대중 인지도와 산업 수요가 모두 높은 직업군",
      majors: ["컴퓨터공학", "인공지능", "소프트웨어", "수학", "통계학"],
      skills: ["수리·논리", "알고리즘", "실험", "오류수정", "데이터"],
      weights: { logic: 11, data: 10, inquiry: 7, reflection: 6, leadership: 3, public: 2, communication: 3 },
      links: {
        public: "https://www.career.go.kr/cloud/m/job/view?seq=10117",
        blog: "https://search.naver.com/search.naver?where=blog&query=%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5+%EC%97%94%EC%A7%80%EB%8B%88%EC%96%B4+%EC%A7%81%EB%AC%B4+%EC%B2%B4%ED%97%98",
        video: "https://www.youtube.com/results?search_query=%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5+%EC%97%94%EC%A7%80%EB%8B%88%EC%96%B4+%EC%A7%81%EC%97%85+%EC%9D%B8%ED%84%B0%EB%B7%B0"
      },
      experience: "문제 답변을 분류하는 간단한 규칙을 만들고, 어떤 답에서 잘못 분류되는지 테스트해 수정해보세요."
    },
    {
      id: "social-researcher",
      icon: "🎤",
      name: "사회조사 분석가",
      group: "조사·리서치",
      description: "설문·인터뷰·관찰을 설계하고 사람들의 의견과 행동을 분석해 기업과 공공기관의 의사결정에 필요한 정보를 제공합니다.",
      salary: "연 3,500만~5,000만원 참고",
      salaryNote: "통계·시장·사회조사 관련 직업군 공개 임금정보를 바탕으로 한 참고 범위",
      recognition: "보통",
      recognitionNote: "직업명 자체의 대중 인지도는 보통이나 정책·시장조사의 핵심 실무직",
      majors: ["사회학", "통계학", "심리학", "언론정보", "행정학"],
      skills: ["질문설계", "경청", "자료분석", "편향점검", "보고서"],
      weights: { inquiry: 11, communication: 9, data: 7, reflection: 7, public: 5, leadership: 3, logic: 5 },
      links: {
        public: "https://www.career.go.kr/cloud/m/job/view?seq=165",
        blog: "https://search.naver.com/search.naver?where=blog&query=%EC%82%AC%ED%9A%8C%EC%A1%B0%EC%82%AC%EB%B6%84%EC%84%9D%EC%82%AC+%EC%A7%81%EB%AC%B4+%ED%98%84%EC%9E%A5",
        video: "https://www.youtube.com/results?search_query=%EC%82%AC%ED%9A%8C%EC%A1%B0%EC%82%AC%EB%B6%84%EC%84%9D%EC%82%AC+%EC%A7%81%EC%97%85"
      },
      experience: "친구 10명에게 같은 질문으로 인터뷰하고, 답을 3가지 유형으로 분류한 뒤 질문의 편향이 없는지 검토해보세요."
    },
    {
      id: "education-planner",
      icon: "🧑‍🏫",
      name: "교육프로그램 기획자",
      group: "교육·콘텐츠·운영",
      description: "학습자의 수준과 요구를 분석하고 수업, 체험, 온라인 교육과정을 설계하며 운영성과를 평가하고 개선합니다.",
      salary: "연 3,500만~5,000만원 참고",
      salaryNote: "교육·훈련 사무원 및 사이버교육 운영 관련 직업군 공개 임금정보 참고",
      recognition: "중상",
      recognitionNote: "학교·기업·공공기관·에듀테크 산업에서 폭넓게 활동하는 직업군",
      majors: ["교육학", "교육공학", "심리학", "콘텐츠기획", "컴퓨터교육"],
      skills: ["설명", "협업", "과정설계", "피드백", "학습분석"],
      weights: { communication: 10, leadership: 8, reflection: 8, inquiry: 6, public: 5, data: 4, logic: 4 },
      links: {
        public: "https://www.career.go.kr/cloud/m/job/view?seq=462",
        blog: "https://search.naver.com/search.naver?where=blog&query=%EA%B5%90%EC%9C%A1%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8+%EA%B8%B0%ED%9A%8D%EC%9E%90+%EC%A7%81%EB%AC%B4",
        video: "https://www.youtube.com/results?search_query=%EA%B5%90%EC%9C%A1%EA%B3%B5%ED%95%99+%EA%B5%90%EC%9C%A1%EA%B8%B0%ED%9A%8D+%EC%A7%81%EC%97%85"
      },
      experience: "친구가 어려워한 개념을 3단계 질문과 활동으로 다시 설계하고, 사용 후 피드백을 받아 개선해보세요."
    }
  ];

  function countText(text, patterns) {
    const source = String(text || "");
    return patterns.reduce((sum, pattern) => sum + (source.match(pattern) || []).length, 0);
  }

  function buildProfile(records, quest, feedbacks) {
    const profile = { logic: 0, data: 0, inquiry: 0, public: 0, leadership: 0, communication: 0, reflection: 0, spatial: 0 };
    const evidence = [];

    records.forEach((record) => {
      const text = [record.subject, record.topic, record.summary, record.title, record.nextGoal, ...(record.strengths || [])].join(" ");
      profile.logic += countText(text, [/수학/g,/논리/g,/개념/g,/원리/g,/오답/g,/방정식/g]);
      profile.data += countText(text, [/자료/g,/통계/g,/근거/g,/분석/g,/비교/g]);
      profile.inquiry += countText(text, [/질문/g,/탐구/g,/관찰/g,/원인/g]);
      profile.communication += countText(text, [/설명/g,/표현/g,/토론/g,/주장/g]);
      profile.reflection += countText(text, [/성찰/g,/자기/g,/교정/g,/달라/g]);
      evidence.push({ type: "생각스튜디오", title: `${record.subject} · ${record.topic}`, text: record.summary || record.title });
    });

    const answers = quest?.answers || {};
    const answerText = Object.values(answers).join(" ");
    profile.inquiry += Object.keys(answers).length * 2 + countText(answerText, [/왜/g,/원인/g,/조사/g,/인터뷰/g]);
    profile.data += countText(answerText, [/통계/g,/자료/g,/지도/g,/수치/g,/사진/g]);
    profile.public += countText(answerText, [/주민/g,/학생/g,/학부모/g,/시청/g,/행정/g,/정책/g,/안전/g,/지역/g]);
    profile.communication += countText(answerText, [/의견/g,/인터뷰/g,/설명/g,/토의/g]);
    profile.reflection += countText(answerText, [/부작용/g,/실패/g,/보완/g,/수정/g]);
    profile.spatial += countText(answerText, [/지도/g,/공간/g,/횡단보도/g,/통학로/g,/도로/g]);

    if (quest?.leaderId === "student-1") {
      profile.leadership += 8;
      evidence.push({ type: "로컬퀘스트", title: "팀리더 경험", text: "팀의 역할과 프로젝트 흐름을 조율한 기록이 있습니다." });
    }
    const myVote = quest?.votes?.["student-1"];
    if (myVote?.comment) {
      profile.communication += 4;
      profile.reflection += myVote.agree === false ? 3 : 1;
      evidence.push({ type: "팀 협력", title: myVote.agree ? "대안 합의 참여" : "보완 의견 제시", text: myVote.comment });
    }
    if ((quest?.sourcesUsed || []).length) {
      profile.data += quest.sourcesUsed.length * 2;
      evidence.push({ type: "자료탐색", title: `${quest.sourcesUsed.length}개의 공공자료 확인`, text: quest.sourcesUsed.map((source) => source.title).slice(0,3).join(" · ") });
    }
    if (quest?.proposal) evidence.push({ type: "대안설계", title: "실행 가능한 대안 작성", text: quest.proposal });
    if (quest?.simulation) {
      profile.reflection += 5;
      evidence.push({ type: "시뮬레이션", title: "부작용과 실패가능성 검토", text: quest.simulation });
    }
    if (quest?.officialDiscussion?.started) profile.public += 5;
    if (quest?.officialDiscussion?.finished) profile.communication += 4;

    const confirmed = Object.values(feedbacks || {}).filter((item) => item?.status === "confirmed");
    if (confirmed.length) {
      profile.reflection += confirmed.length * 2;
      evidence.push({ type: "교사 피드백", title: `${confirmed.length}개의 확인 피드백`, text: confirmed[0].text });
    }

    Object.keys(profile).forEach((key) => { profile[key] = Math.min(20, profile[key]); });
    return { profile, evidence: evidence.slice(0,8) };
  }

  function rankJobs(profile) {
    return JOBS.map((job) => {
      const raw = Object.entries(job.weights).reduce((sum, [key, weight]) => sum + (profile[key] || 0) * weight, 0);
      const max = Object.values(job.weights).reduce((sum, weight) => sum + 20 * weight, 0);
      const fit = Math.max(58, Math.min(96, Math.round(55 + (raw / max) * 43)));
      const reasons = Object.entries(job.weights)
        .map(([key, weight]) => ({ key, value: (profile[key] || 0) * weight }))
        .sort((a,b) => b.value - a.value)
        .slice(0,3)
        .map((item) => ({ logic:"수리·논리", data:"자료분석", inquiry:"탐구·질문", public:"공공문제 관심", leadership:"리더십", communication:"소통·협력", reflection:"성찰·수정", spatial:"공간적 사고" })[item.key]);
      return { ...job, fit, reasons };
    }).sort((a,b) => b.fit - a.fit || a.name.localeCompare(b.name)).slice(0,3);
  }

  function renderProfile(profile) {
    const labels = { logic:"수리·논리", data:"자료분석", inquiry:"탐구·질문", public:"공공문제", leadership:"리더십", communication:"소통·협력", reflection:"성찰·수정", spatial:"공간적 사고" };
    byId("abilityGrid").innerHTML = Object.entries(profile)
      .sort((a,b) => b[1]-a[1])
      .map(([key,value]) => `<article class="ability"><div><b>${labels[key]}</b><span>${Math.round((value/20)*100)}%</span></div><i><em style="width:${Math.round((value/20)*100)}%"></em></i></article>`).join("");
  }

  function renderEvidence(evidence) {
    byId("evidenceList").innerHTML = evidence.length ? evidence.map((item) => `<article class="evidence"><span>${esc(item.type)}</span><b>${esc(item.title)}</b><p>${esc(item.text)}</p></article>`).join("") : `<div class="empty">생각스튜디오와 로컬퀘스트 활동을 완료하면 진로 근거가 이곳에 쌓입니다.</div>`;
  }

  function renderRankings(rankings) {
    byId("rankingList").innerHTML = rankings.map((job,index) => `<button class="rank-card ${index===0?"on":""}" data-job-id="${job.id}"><span class="rank-no">${index+1}</span><span class="rank-icon">${job.icon}</span><span class="rank-copy"><b>${esc(job.name)}</b><small>${esc(job.group)}</small><em>${job.reasons.join(" · ")}</em></span><strong>${job.fit}%</strong></button>`).join("");
    byId("rankingList").querySelectorAll("[data-job-id]").forEach((button) => button.addEventListener("click", () => {
      byId("rankingList").querySelectorAll(".rank-card").forEach((card) => card.classList.toggle("on", card===button));
      renderJobDetail(rankings.find((job) => job.id === button.dataset.jobId));
    }));
    renderJobDetail(rankings[0]);
  }

  function renderJobDetail(job) {
    if (!job) return;
    byId("jobDetail").innerHTML = `
      <header class="job-head"><div class="job-symbol">${job.icon}</div><div><span>${esc(job.group)}</span><h2>${esc(job.name)}</h2><p>현재 활동기록 기준 적합도 <b>${job.fit}%</b></p></div></header>
      <p class="job-desc">${esc(job.description)}</p>
      <div class="job-stats"><article><small>참고 연봉</small><strong>${esc(job.salary)}</strong><p>${esc(job.salaryNote)}</p></article><article><small>사회적 인지도</small><strong>${esc(job.recognition)}</strong><p>${esc(job.recognitionNote)}</p></article></div>
      <section class="detail-section"><h3>왜 연결되었나요?</h3><div class="reason-chips">${job.reasons.map((reason) => `<span>${esc(reason)}</span>`).join("")}</div></section>
      <section class="detail-section"><h3>관련 전공</h3><div class="major-list">${job.majors.map((major) => `<span>${esc(major)}</span>`).join("")}</div></section>
      <section class="detail-section experience"><h3>바로 해볼 간접체험</h3><p>${esc(job.experience)}</p></section>
      <section class="detail-section"><h3>직업정보·현장자료</h3><div class="resource-links"><a href="${job.links.public}" target="_blank" rel="noopener">🏛️ 공공기관 직업정보 ↗</a><a href="${job.links.blog}" target="_blank" rel="noopener">📝 블로그 현장기록 ↗</a><a href="${job.links.video}" target="_blank" rel="noopener">▶️ 유튜브 직업영상 ↗</a></div></section>`;
  }

  function init() {
    if (!window.TTAIStorage) return;
    const records = window.TTAIStorage.getGrowthRecords();
    const quest = window.TTAIStorage.getLocalQuest();
    const feedbacks = window.TTAIStorage.getFeedbacks();
    const { profile, evidence } = buildProfile(records, quest, feedbacks);
    const rankings = rankJobs(profile);
    renderProfile(profile);
    renderEvidence(evidence);
    renderRankings(rankings);
    byId("analysisMeta").textContent = `생각스튜디오 ${records.length}건 · 로컬퀘스트 ${Object.keys(quest.answers || {}).length}단계 · 교사 확인 ${Object.values(feedbacks).filter((item)=>item?.status==="confirmed").length}건 반영`;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  window.addEventListener("focus", init);
  window.addEventListener("storage", init);
})();
