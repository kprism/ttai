(() => {
  "use strict";

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function findScenario(grade, question, scenarios) {
    const normalized = normalize(question);
    const levelMatches = scenarios.filter((scenario) => scenario.levels.includes(grade));
    const keywordMatch = levelMatches.find((scenario) =>
      scenario.keywords.some((keyword) => normalized.includes(normalize(keyword)))
    );
    return keywordMatch || levelMatches[0] || scenarios[0];
  }

  function safeText(value) {
    return String(value ?? "");
  }

  function createBubble(role, text, meta) {
    const article = document.createElement("article");
    article.className = `message ${role}`;

    const head = document.createElement("div");
    head.className = "message-head";
    head.innerHTML = role === "ai"
      ? '<span class="bubble-avatar">✨</span><strong>생각자국 AI</strong>'
      : '<span class="bubble-avatar">🧑‍🎓</span><strong>나</strong>';

    const body = document.createElement("div");
    body.className = "message-body";
    body.textContent = safeText(text);

    article.append(head, body);

    if (meta) {
      const foot = document.createElement("div");
      foot.className = "message-meta";
      foot.textContent = meta;
      article.appendChild(foot);
    }

    return article;
  }

  class ThinkStudioDemo {
    constructor(options) {
      this.grade = options.grade;
      this.scenarios = options.scenarios;
      this.elements = options.elements;
      this.scenario = null;
      this.currentStepId = null;
      this.completed = false;
      this.history = [];
      this.renderWelcome();
    }

    renderWelcome() {
      const copy = window.TTAI_GRADE_COPY[this.grade] || window.TTAI_GRADE_COPY.m2;
      this.elements.chat.replaceChildren();
      this.appendAI(
        `${copy.title}\n\n${copy.intro}\n\n질문을 직접 입력하거나 왼쪽의 예시 질문을 눌러 시작해보세요.`,
        "질문을 받으면 과목과 학습주제를 자동으로 찾아요"
      );
      this.updatePhase("질문 준비", ["질문하기", "현재 생각 표현"]);
      this.elements.progress.style.width = "6%";
      this.elements.resetButton.hidden = true;
    }

    appendAI(text, meta) {
      this.elements.chat.appendChild(createBubble("ai", text, meta));
      this.scrollToLatest();
    }

    appendStudent(text) {
      this.elements.chat.appendChild(createBubble("student", text));
      this.scrollToLatest();
    }

    scrollToLatest() {
      requestAnimationFrame(() => {
        this.elements.chat.scrollTop = this.elements.chat.scrollHeight;
      });
    }

    start(question) {
      const cleanQuestion = safeText(question).trim();
      if (!cleanQuestion) return false;

      this.scenario = findScenario(this.grade, cleanQuestion, this.scenarios);
      this.currentStepId = this.scenario.start;
      this.completed = false;
      this.history = [];
      this.elements.chat.replaceChildren();
      this.appendStudent(cleanQuestion);
      this.appendAI(
        `네 질문을 이렇게 이해했어.\n\n${this.scenario.understood}\n\n과목은 '${this.scenario.subject}', 주제는 '${this.scenario.topic}'으로 연결했어. 맞는지 함께 확인하면서 시작해보자.`,
        "정답을 바로 주지 않고 이해상태부터 확인합니다"
      );
      this.elements.resetButton.hidden = false;
      this.showCurrentStep();
      return true;
    }

    showCurrentStep() {
      if (!this.scenario || this.completed) return;
      const step = this.scenario.steps[this.currentStepId];
      if (!step) {
        this.complete();
        return;
      }

      this.appendAI(step.prompt, step.phase);
      this.renderChoices(step);
      this.updatePhase(step.phase, step.skills || []);
      this.updateProgress();
    }

    renderChoices(step) {
      this.elements.choices.replaceChildren();
      const choices = Array.isArray(step.choices) ? step.choices : [];

      choices.forEach((choice, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice-button";
        button.innerHTML = `<span>${index + 1}</span>${safeText(choice.label)}`;
        button.addEventListener("click", () => this.choose(choice));
        this.elements.choices.appendChild(button);
      });

      if (choices.length) {
        const hint = document.createElement("p");
        hint.className = "choice-hint";
        hint.textContent = "선택하거나 아래 입력창에 내 생각을 직접 적어도 됩니다.";
        this.elements.choices.appendChild(hint);
      } else {
        const hint = document.createElement("p");
        hint.className = "choice-hint strong";
        hint.textContent = "아래 입력창에 자신의 말로 답해보세요. 음성입력도 사용할 수 있습니다.";
        this.elements.choices.appendChild(hint);
      }
    }

    choose(choice) {
      if (this.completed) return;
      this.appendStudent(choice.label);
      this.history.push({ step: this.currentStepId, answer: choice.label, mode: "choice" });
      this.elements.choices.replaceChildren();
      this.appendAI(choice.response, "학생의 선택을 바탕으로 다음 단계를 조정했어요");
      this.goNext(choice.next);
    }

    answer(text) {
      const cleanText = safeText(text).trim();
      if (!cleanText) return false;

      if (!this.scenario) {
        return this.start(cleanText);
      }

      if (this.completed) {
        this.start(cleanText);
        return true;
      }

      const step = this.scenario.steps[this.currentStepId];
      this.appendStudent(cleanText);
      this.history.push({ step: this.currentStepId, answer: cleanText, mode: "text" });
      this.elements.choices.replaceChildren();
      this.appendAI(
        step.freeResponse || "네 생각을 확인했어. 이제 다음 단계에서 그 생각을 새로운 상황에 적용해보자.",
        "학생의 설명을 바탕으로 핵심 개념을 다시 연결했어요"
      );
      this.goNext(step.next || this.getFirstChoiceNext(step));
      return true;
    }

    getFirstChoiceNext(step) {
      return Array.isArray(step.choices) && step.choices[0] ? step.choices[0].next : "complete";
    }

    goNext(next) {
      if (!next || next === "complete") {
        this.complete();
        return;
      }
      this.currentStepId = next;
      window.setTimeout(() => this.showCurrentStep(), 300);
    }

    updatePhase(phase, skills) {
      this.elements.phase.textContent = phase;
      this.elements.skills.replaceChildren();
      skills.forEach((skill) => {
        const span = document.createElement("span");
        span.textContent = skill;
        this.elements.skills.appendChild(span);
      });
    }

    updateProgress() {
      if (!this.scenario) return;
      const ids = Object.keys(this.scenario.steps);
      const index = Math.max(0, ids.indexOf(this.currentStepId));
      const percent = Math.min(92, 16 + ((index + 1) / ids.length) * 72);
      this.elements.progress.style.width = `${percent}%`;
    }

    complete() {
      this.completed = true;
      this.elements.choices.replaceChildren();
      this.elements.progress.style.width = "100%";
      this.updatePhase("성찰과 다음 목표", this.scenario.growth.strengths);

      const card = document.createElement("section");
      card.className = "growth-result";
      card.innerHTML = `
        <div class="growth-icon">🌱</div>
        <div>
          <span class="result-label">오늘의 성장기록</span>
          <h3>${safeText(this.scenario.growth.title)}</h3>
          <p>${safeText(this.scenario.growth.summary)}</p>
          <div class="result-strengths">${this.scenario.growth.strengths.map((item) => `<span>${safeText(item)}</span>`).join("")}</div>
          <strong>다음 목표</strong>
          <p>${safeText(this.scenario.growth.nextGoal)}</p>
        </div>
      `;
      this.elements.chat.appendChild(card);
      this.saveGrowthRecord();
      this.scrollToLatest();

      const again = document.createElement("button");
      again.type = "button";
      again.className = "choice-button primary-choice";
      again.innerHTML = "<span>↻</span>다른 질문으로 새로 시작하기";
      again.addEventListener("click", () => this.reset());
      this.elements.choices.appendChild(again);
    }

    saveGrowthRecord() {
      const key = "ttai_growth_records";
      let records = [];
      try {
        records = JSON.parse(localStorage.getItem(key)) || [];
      } catch (error) {
        records = [];
      }
      records.unshift({
        id: `${Date.now()}-${this.scenario.id}`,
        date: new Date().toISOString(),
        grade: this.grade,
        scenarioId: this.scenario.id,
        subject: this.scenario.subject,
        topic: this.scenario.topic,
        title: this.scenario.growth.title,
        summary: this.scenario.growth.summary,
        strengths: this.scenario.growth.strengths,
        nextGoal: this.scenario.growth.nextGoal,
        responseCount: this.history.length
      });
      localStorage.setItem(key, JSON.stringify(records.slice(0, 20)));
      this.elements.savedNotice.hidden = false;
      window.setTimeout(() => {
        this.elements.savedNotice.hidden = true;
      }, 3200);
    }

    reset() {
      this.scenario = null;
      this.currentStepId = null;
      this.completed = false;
      this.history = [];
      this.elements.choices.replaceChildren();
      this.renderWelcome();
      this.elements.input.focus();
    }
  }

  window.TTAIDemoEngine = {
    create(options) {
      return new ThinkStudioDemo(options);
    }
  };
})();
