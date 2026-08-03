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
})();
