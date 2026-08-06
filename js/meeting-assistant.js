(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let listening = false;
  let transcriptHistory = [];

  function safeText(id, text) {
    const element = byId(id);
    if (element) element.textContent = text;
  }

  function buildAnalysis(text) {
    const normalized = String(text || "").trim();
    if (!normalized) return;
    transcriptHistory.push(normalized);
    transcriptHistory = transcriptHistory.slice(-8);
    const joined = transcriptHistory.join(" ");

    const agenda = [];
    if (/문제|위험|불편|원인/.test(joined)) agenda.push("문제와 원인을 더 구체적으로 정리하기");
    if (/조사|통계|자료|인터뷰|사진|지도/.test(joined)) agenda.push("필요한 조사자료와 역할을 확정하기");
    if (/대안|해결|방법|제안/.test(joined)) agenda.push("실행 가능한 대안을 비교하기");
    if (/비용|예산|부작용|위험/.test(joined)) agenda.push("비용과 부작용을 시뮬레이션하기");
    if (!agenda.length) agenda.push("팀원의 핵심 의견을 모아 다음 행동을 정하기");

    const keywords = [...new Set((joined.match(/[가-힣]{2,}/g) || []).filter((word) => !["그리고","그래서","우리","생각","합니다","있는","하는","것을"].includes(word)))].slice(0,6);
    safeText("meetingSummaryText", keywords.length ? "핵심어: " + keywords.join(" · ") : "발언 내용을 분석하고 있습니다.");
    const agendaList = byId("meetingAgendaList");
    if (agendaList) agendaList.innerHTML = agenda.map((item) => "<li>" + item + "</li>").join("");
    safeText("meetingDecisionText", "현재까지의 협의: " + transcriptHistory.slice(-3).join(" / "));
  }

  function stopRecognition() {
    listening = false;
    if (recognition) {
      try { recognition.stop(); } catch (error) { /* already stopped */ }
    }
    const button = byId("captionBtn");
    if (button) button.textContent = "📝 실시간 자막 시작";
  }

  function startRecognition() {
    const button = byId("captionBtn");
    if (!SpeechRecognition) {
      safeText("localTranscript", "이 브라우저는 음성 자막을 지원하지 않습니다. Chrome에서 시연해 주세요.");
      if (button) button.disabled = true;
      return;
    }

    if (!recognition) {
      recognition = new SpeechRecognition();
      recognition.lang = "ko-KR";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let interim = "";
        let finalText = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const text = event.results[index][0].transcript;
          if (event.results[index].isFinal) finalText += text + " ";
          else interim += text;
        }
        const visible = (finalText + interim).trim();
        if (visible) safeText("localTranscript", visible);
        if (finalText.trim()) buildAnalysis(finalText.trim());
      };
      recognition.onerror = () => {
        safeText("localTranscript", "음성인식이 잠시 멈췄습니다. 자막 시작 버튼을 다시 눌러주세요.");
        stopRecognition();
      };
      recognition.onend = () => {
        if (listening) {
          try { recognition.start(); } catch (error) { stopRecognition(); }
        }
      };
    }

    listening = true;
    try {
      recognition.start();
      if (button) button.textContent = "⏹️ 실시간 자막 중지";
      safeText("localTranscript", "말을 시작하면 이곳에 자막이 표시됩니다.");
    } catch (error) {
      stopRecognition();
    }
  }

  function init() {
    const captionButton = byId("captionBtn");
    if (captionButton) {
      captionButton.addEventListener("click", () => {
        if (listening) stopRecognition();
        else startRecognition();
      });
    }

    const closeButton = byId("closeMeetingBtn");
    if (closeButton) closeButton.addEventListener("click", stopRecognition);

    const openButton = byId("openMeetingBtn");
    if (openButton) {
      openButton.addEventListener("click", () => {
        transcriptHistory = [];
        safeText("meetingSummaryText", "회의 발언이 들어오면 핵심어와 쟁점을 자동 정리합니다.");
        safeText("meetingDecisionText", "아직 협의된 결론이 없습니다.");
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
