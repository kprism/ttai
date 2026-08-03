(() => {
  "use strict";

  function getRecognitionConstructor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  window.TTAIVoice = {
    attach({ button, input, status }) {
      const Recognition = getRecognitionConstructor();
      let recognition = null;
      let listening = false;

      if (!button || !input) return;

      if (!Recognition) {
        button.disabled = true;
        button.title = "이 브라우저에서는 음성입력을 지원하지 않습니다.";
        button.setAttribute("aria-label", "음성입력 미지원");
        if (status) status.textContent = "현재 브라우저에서는 음성입력을 지원하지 않아 키보드 입력을 사용합니다.";
        return;
      }

      recognition = new Recognition();
      recognition.lang = "ko-KR";
      recognition.interimResults = true;
      recognition.continuous = false;

      function setListening(next) {
        listening = next;
        button.classList.toggle("listening", listening);
        button.setAttribute("aria-pressed", String(listening));
        button.innerHTML = listening ? "⏹" : "🎙️";
        button.title = listening ? "음성입력 멈추기" : "음성으로 입력하기";
        if (status) {
          status.textContent = listening
            ? "듣고 있어요. 천천히 말한 뒤 잠시 기다려 주세요."
            : "키보드로 쓰거나 마이크를 눌러 말할 수 있어요.";
        }
      }

      recognition.addEventListener("start", () => setListening(true));

      recognition.addEventListener("result", (event) => {
        let transcript = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          transcript += event.results[index][0].transcript;
        }
        input.value = transcript.trim();
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });

      recognition.addEventListener("end", () => setListening(false));

      recognition.addEventListener("error", (event) => {
        setListening(false);
        if (!status) return;
        const messages = {
          "not-allowed": "마이크 권한이 차단되었습니다. 브라우저 주소창에서 마이크 권한을 허용해 주세요.",
          "no-speech": "목소리가 들리지 않았어요. 마이크를 다시 눌러 천천히 말해보세요.",
          "audio-capture": "사용할 수 있는 마이크를 찾지 못했습니다.",
          network: "음성인식 연결이 원활하지 않습니다. 키보드 입력을 사용해 주세요."
        };
        status.textContent = messages[event.error] || "음성입력을 완료하지 못했습니다. 키보드로 입력할 수 있어요.";
      });

      button.addEventListener("click", () => {
        if (listening) {
          recognition.stop();
          return;
        }
        try {
          recognition.start();
        } catch (error) {
          if (status) status.textContent = "음성입력을 다시 시작해 주세요.";
        }
      });
    }
  };

  function initLocalQuestEntry() {
    const gradeSelect = document.getElementById("gradeSelect");
    const principle = document.querySelector(".principle");
    if (!gradeSelect || !principle || document.getElementById("localQuestEntry")) return;

    const gradeOrder = ["e1", "e2", "e3", "e4", "e5", "e6", "m1", "m2", "m3", "h1", "h2", "h3"];
    let session = { role: "student", grade: gradeSelect.value || "m2" };
    try {
      session = JSON.parse(localStorage.getItem("ttai_demo_session")) || session;
    } catch (error) {
      session = { role: "student", grade: gradeSelect.value || "m2" };
    }

    const entry = document.createElement("section");
    entry.id = "localQuestEntry";
    entry.style.cssText = "margin-top:16px;padding:15px;border:1px solid rgba(0,177,216,.28);border-radius:17px;background:linear-gradient(145deg,#e9fbff,#fff);";
    entry.innerHTML = '<strong style="display:block;color:#00288a">🗺️ 로컬퀘스트</strong>' +
      '<p style="margin:7px 0 12px;color:#53657a;font-size:12px;line-height:1.55">교과에서 익힌 사고방법으로 지역의 실제 문제를 팀과 함께 해결합니다.</p>' +
      '<a id="localQuestEntryLink" style="display:inline-flex;padding:10px 12px;border-radius:12px;color:#fff;background:linear-gradient(135deg,#00288a,#017bc5);font-size:12px;font-weight:900;text-decoration:none">로컬퀘스트 시작 →</a>' +
      '<small id="localQuestEntryNote" style="display:block;margin-top:9px;color:#7b8b9e;line-height:1.45"></small>';
    principle.insertAdjacentElement("afterend", entry);

    function updateEntry() {
      const grade = gradeSelect.value || session.grade || "m2";
      const eligible = gradeOrder.indexOf(grade) >= gradeOrder.indexOf("m2");
      const link = document.getElementById("localQuestEntryLink");
      const note = document.getElementById("localQuestEntryNote");
      entry.style.display = eligible ? "block" : "none";
      link.href = "./local-quest.html?role=" + encodeURIComponent(session.role || "student") + "&grade=" + encodeURIComponent(grade);
      note.textContent = eligible
        ? "중학교 2학년부터 선생님이 확정한 주제와 팀으로 참여합니다."
        : "중학교 2학년부터 이용할 수 있습니다.";
    }

    gradeSelect.addEventListener("change", updateEntry);
    updateEntry();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLocalQuestEntry);
  } else {
    initLocalQuestEntry();
  }
})();
