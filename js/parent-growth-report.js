(() => {
  "use strict";

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

  function initParentReport() {
    if (!window.TTAIStorage) {
      console.error("학부모 성장리포트: 저장 모듈을 불러오지 못했습니다.");
      return;
    }

    const records = window.TTAIStorage.getGrowthRecords();
    const latest = records[0] || null;
    const feedbacks = window.TTAIStorage.getFeedbacks();
    const confirmed = latest ? feedbacks[latest.id] : null;
    const quest = window.TTAIStorage.getLocalQuest();
    const allStrengths = [...new Set(records.flatMap((item) => item.strengths || []))];

    const metrics = [
      ["새 성장소식", records.length + "개", records.some((item) => item.sample) ? "예시 기록 포함" : "최근 학습활동"],
      ["최근 관심영역", latest?.subject || "학습", "가장 최근 활동"],
      ["확인된 강점", allStrengths.length + "개", "활동에서 관찰된 변화"],
      ["교사 확인", confirmed ? "완료" : "대기", "AI 초안과 구분"]
    ];

    byId("metrics").innerHTML = metrics.map((item) => (
      '<article class="metric"><small>' + escapeHtml(item[0]) + '</small><strong>' +
      escapeHtml(item[1]) + '</strong><p>' + escapeHtml(item[2]) + '</p></article>'
    )).join("");

    if (latest) {
      const teacherBlock = confirmed
        ? '<div class="teacher"><h4>✅ 선생님이 확인한 피드백</h4><p>' + escapeHtml(confirmed.text) + '</p><small>' +
          escapeHtml(confirmed.teacherName) + ' · ' + escapeHtml(window.TTAIStorage.formatDate(confirmed.confirmedAt)) + '</small></div>'
        : '<div class="teacher pending"><h4>⏳ 선생님 확인 대기</h4><p>아래 내용은 학습과정을 정리한 시연 요약입니다. 선생님이 검토한 뒤 공식 피드백으로 표시됩니다.</p><small>AI가 단독으로 학생을 평가하지 않습니다.</small></div>';

      byId("summary").innerHTML = '<span class="label">' + (latest.sample ? "예시 성장소식" : "최근 성장소식") + '</span>' +
        '<h3>' + escapeHtml(latest.title) + '</h3><p>' + escapeHtml(latest.summary) + '</p><div class="chips">' +
        (latest.strengths || []).map((item) => '<span class="chip">' + escapeHtml(item) + '</span>').join("") +
        '</div>' + teacherBlock;

      byId("goal").innerHTML = '<h3>🎯 다음에 이어갈 목표</h3><p>' + escapeHtml(latest.nextGoal) + '</p>';
      byId("questions").innerHTML = window.TTAIStorage.parentQuestions(latest).map((text, index) => (
        '<article class="question"><b>' + (index + 1) + '</b><p>' + escapeHtml(text) + '</p></article>'
      )).join("");

      const icons = ["🌱", "💡", "🔎", "📘", "🧩", "✨"];
      byId("history").innerHTML = records.slice(0, 5).map((item, index) => (
        '<article class="history-item"><div class="history-icon">' + icons[index % icons.length] + '</div><div><h4>' +
        escapeHtml(item.subject) + ' · ' + escapeHtml(item.topic) + '</h4><p>' + escapeHtml(item.summary) + '</p><time>' +
        escapeHtml(window.TTAIStorage.formatDate(item.date)) + '</time></div></article>'
      )).join("");
    }

    const stageLabel = quest.stageLabels?.[quest.stage] || "프로젝트 준비";
    const leader = quest.team?.find((member) => member.id === quest.leaderId);
    const agreed = Object.values(quest.votes || {}).filter((vote) => vote.agree === true).length;
    const totalVotes = quest.team?.length || 0;
    const resultText = quest.municipalResult?.text
      ? '<div class="quest-result"><strong>🏛️ 시정 반영결과</strong><p>' + escapeHtml(quest.municipalResult.text) + '</p></div>'
      : '<div class="quest-result pending-result"><strong>🏛️ 시정 반영결과 대기</strong><p>담당기관과의 토의가 끝나면 공식 검토결과만 이곳에 표시됩니다.</p></div>';

    byId("questSummary").innerHTML = '<div class="quest-title"><span>🗺️ 로컬퀘스트</span><strong>' + escapeHtml(quest.title) + '</strong></div>' +
      '<p>' + escapeHtml(quest.topic) + '</p>' +
      '<div class="quest-grid"><div><small>현재 단계</small><b>' + escapeHtml(stageLabel) + '</b></div>' +
      '<div><small>팀리더</small><b>' + escapeHtml(leader?.name || "선생님 확인 대기") + '</b></div>' +
      '<div><small>팀 합의</small><b>' + agreed + '/' + totalVotes + '명</b></div>' +
      '<div><small>교사 확인</small><b>' + (quest.teacherConfirmed ? "완료" : "대기") + '</b></div></div>' +
      '<div class="parent-note"><strong>가정에서의 지원</strong><p>대안을 대신 정해주기보다 “누구의 입장도 더 확인해야 할까?”, “실제로 실행하면 어떤 문제가 생길까?”라고 질문해 주세요.</p></div>' +
      resultText;

    const guideBtn = byId("guideBtn");
    const guidePanel = byId("guidePanel");
    guideBtn.addEventListener("click", () => {
      guidePanel.hidden = !guidePanel.hidden;
    });
    document.addEventListener("click", (event) => {
      if (!guidePanel.hidden && !event.target.closest(".guide")) guidePanel.hidden = true;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initParentReport);
  } else {
    initParentReport();
  }
})();
