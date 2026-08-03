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

  function initTeacherCopilot() {
    if (!window.TTAIStorage) {
      console.error("교사 코파일럿: 저장 모듈을 불러오지 못했습니다.");
      return;
    }

    const records = window.TTAIStorage.getGrowthRecords();
    const feedbacks = window.TTAIStorage.getFeedbacks();
    let selected = records[0] || null;

    const confirmedCount = records.filter((record) => {
      const feedback = feedbacks[record.id];
      return feedback && feedback.status === "confirmed";
    }).length;

    const metrics = [
      ["검토할 활동", records.length + "건", "최근 학습기록"],
      ["확인 완료", confirmedCount + "건", "교사가 전달한 피드백"],
      ["반복 오개념", "1개", "등식의 균형 원리"],
      ["예상 절감시간", "38분", "요약·초안 작성 기준"]
    ];

    const metricsElement = byId("metrics");
    const listElement = byId("recordList");
    const inputElement = byId("feedbackInput");
    const insightElement = byId("insight");
    const confirmedBox = byId("confirmedBox");

    metricsElement.innerHTML = metrics.map((item) => (
      '<article class="metric"><small>' + escapeHtml(item[0]) + '</small><strong>' +
      escapeHtml(item[1]) + '</strong><p>' + escapeHtml(item[2]) + '</p></article>'
    )).join("");

    function currentDraft() {
      return selected ? window.TTAIStorage.teacherDraft(selected) : "";
    }

    function renderList() {
      if (!selected || records.length === 0) {
        listElement.innerHTML = '<p style="color:#53657a;line-height:1.6">아직 검토할 학생 활동이 없습니다. 학생 계정으로 생각스튜디오를 완료하면 이곳에 기록이 나타납니다.</p>';
        return;
      }

      listElement.innerHTML = records.map((record, index) => {
        const isSelected = selected && record.id === selected.id;
        return '<button type="button" class="record ' + (isSelected ? "on" : "") + '" data-index="' + index + '">' +
          '<strong>' + escapeHtml(record.subject) + ' · ' + escapeHtml(record.topic) + '</strong>' +
          '<small>' + escapeHtml(window.TTAIStorage.formatDate(record.date)) + '</small>' +
          '<span>' + (record.sample ? "예시 기록" : "실제 기록") + '</span>' +
          '</button>';
      }).join("");

      listElement.querySelectorAll(".record").forEach((button) => {
        button.addEventListener("click", () => {
          selected = records[Number(button.dataset.index)];
          renderAll();
        });
      });
    }

    function renderInsight() {
      if (!selected) {
        insightElement.innerHTML = '<h3>검토할 기록이 없습니다</h3><p>학생이 생각스튜디오 학습을 완료하면 AI 요약과 교사 피드백 초안이 생성됩니다.</p>';
        return;
      }

      insightElement.innerHTML = '<h3>' + escapeHtml(selected.studentName || "김생각") + ' · ' +
        escapeHtml(selected.gradeLabel || "") + '</h3><p>' + escapeHtml(selected.summary) + '</p><div class="chips">' +
        (selected.strengths || []).map((item) => '<span class="chip">' + escapeHtml(item) + '</span>').join("") +
        '</div>';
    }

    function renderConfirmed() {
      if (!selected) {
        confirmedBox.hidden = true;
        confirmedBox.textContent = "";
        return;
      }

      const feedback = window.TTAIStorage.getFeedbacks()[selected.id];
      if (!feedback) {
        confirmedBox.hidden = true;
        confirmedBox.textContent = "";
        return;
      }

      confirmedBox.hidden = false;
      confirmedBox.innerHTML = '<strong>✅ 교사 확인 완료</strong><br>' + escapeHtml(feedback.text) +
        '<br><small>' + escapeHtml(window.TTAIStorage.formatDate(feedback.confirmedAt, true)) + '</small>';
    }

    function renderAll() {
      renderList();
      renderInsight();
      inputElement.disabled = !selected;
      byId("restoreBtn").disabled = !selected;
      byId("confirmBtn").disabled = !selected;
      inputElement.value = selected
        ? (window.TTAIStorage.getFeedbacks()[selected.id]?.text || currentDraft())
        : "";
      renderConfirmed();
    }

    byId("restoreBtn").addEventListener("click", () => {
      if (!selected) return;
      inputElement.value = currentDraft();
      inputElement.focus();
    });

    byId("confirmBtn").addEventListener("click", () => {
      if (!selected) return;
      const text = inputElement.value.trim();
      if (!text) {
        inputElement.focus();
        return;
      }

      window.TTAIStorage.saveFeedback(selected.id, text, "김생각 선생님");
      renderConfirmed();
      const toast = byId("toast");
      toast.hidden = false;
      window.setTimeout(() => {
        toast.hidden = true;
      }, 2600);
    });

    if (window.TTAIVoice) {
      window.TTAIVoice.attach({
        button: byId("micBtn"),
        input: inputElement,
        status: byId("voiceStatus")
      });
    }

    const guideBtn = byId("guideBtn");
    const guidePanel = byId("guidePanel");
    guideBtn.addEventListener("click", () => {
      guidePanel.hidden = !guidePanel.hidden;
    });
    document.addEventListener("click", (event) => {
      if (!guidePanel.hidden && !event.target.closest(".guide")) guidePanel.hidden = true;
    });

    renderAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTeacherCopilot);
  } else {
    initTeacherCopilot();
  }
})();
