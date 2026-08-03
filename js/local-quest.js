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
      this.quest = window.TTAIStorage.getLocalQuest();
      this.stream = null;
      this.cameraOn = false;
      this.micOn = true;
      this.bindEvents();
      this.render();
    }

    save() {
      this.quest = window.TTAIStorage.saveLocalQuest(this.quest);
      this.render();
    }

    bindEvents() {
      byId("saveTeacherSetup").addEventListener("click", () => this.saveTeacherSetup());
      byId("submitAnswer").addEventListener("click", () => this.submitStageAnswer());
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
          this.quest = window.TTAIStorage.resetLocalQuest();
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
      if (!this.quest.teacherConfirmed) {
        workspace.innerHTML = '<div class="empty">선생님이 주제와 팀구성을 최종확정하면 AI 프로젝트 안내가 시작됩니다.</div>';
        byId("answerInput").disabled = true;
        byId("submitAnswer").disabled = true;
        return;
      }

      if (this.quest.stage <= 4) {
        const prompt = STAGE_PROMPTS[this.quest.stage];
        const previous = this.quest.answers[prompt.key];
        workspace.innerHTML = '<span class="ai-label">생각자국 AI 질문</span><h3>' + escapeHtml(prompt.title) + '</h3><p>' +
          escapeHtml(prompt.question) + '</p>' + (previous ? '<div class="saved-answer"><strong>내가 적은 생각</strong><p>' +
          escapeHtml(previous) + '</p></div>' : "");
        byId("answerInput").value = previous || "";
        byId("answerInput").disabled = this.session.role !== "student";
        byId("submitAnswer").disabled = this.session.role !== "student";
        byId("answerHint").textContent = "먼저 학생의 생각을 받고, AI는 칭찬과 작은 힌트만 준 뒤 다음 단계로 안내합니다.";
      } else {
        workspace.innerHTML = '<span class="ai-label">탐구 단계 완료</span><h3>이제 팀 합의와 기관 협력 단계입니다</h3><p>문제정의·원인·조사·대안·시뮬레이션 기록을 토대로 팀원 모두의 의견과 동의를 확인합니다.</p>';
        byId("answerInput").value = "";
        byId("answerInput").disabled = true;
        byId("submitAnswer").disabled = true;
      }
    }

    submitStageAnswer() {
      if (this.quest.stage > 4) return;
      const text = byId("answerInput").value.trim();
      if (!text) {
        byId("answerInput").focus();
        return;
      }
      const prompt = STAGE_PROMPTS[this.quest.stage];
      this.quest.answers[prompt.key] = text;
      byId("aiFeedback").innerHTML = '<strong>✨ 좋은 생각이에요.</strong><p>' + escapeHtml(prompt.hint) + '</p>';
      byId("aiFeedback").hidden = false;
      window.setTimeout(() => {
        this.quest.stage = Math.min(5, this.quest.stage + 1);
        if (prompt.key === "alternative") this.quest.proposal = text;
        if (prompt.key === "simulation") this.quest.simulation = text;
        this.save();
        byId("aiFeedback").hidden = true;
      }, 900);
    }

    renderConsensus() {
      const votes = this.quest.votes || {};
      const agreed = Object.values(votes).filter((vote) => vote.agree === true).length;
      const total = this.quest.team.length;
      byId("proposalText").textContent = this.quest.proposal;
      byId("simulationText").textContent = this.quest.simulation;
      byId("voteCount").textContent = agreed + '/' + total + '명 동의';
      byId("voteList").innerHTML = this.quest.team.map((member) => {
        const vote = votes[member.id] || { agree: null, comment: "" };
        const state = vote.agree === true ? "동의" : vote.agree === false ? "보완 요청" : "의견 대기";
        return '<article class="vote"><strong>' + escapeHtml(member.name) + '</strong><span class="vote-state ' +
          (vote.agree === true ? "yes" : vote.agree === false ? "no" : "wait") + '">' + state + '</span><p>' +
          escapeHtml(vote.comment || "아직 의견을 남기지 않았습니다.") + '</p></article>';
      }).join("");
      const visible = this.quest.stage >= 5;
      byId("consensusSection").hidden = !visible;
      byId("completeConsensusBtn").hidden = !["teacher", "admin"].includes(this.session.role);
      if (agreed === total && total > 0 && !this.quest.institution.disclosed) {
        this.quest.institution.disclosed = true;
        this.quest.stage = Math.max(this.quest.stage, 6);
        window.TTAIStorage.saveLocalQuest(this.quest);
      }
    }

    vote(agree) {
      const comment = byId("voteComment").value.trim();
      this.quest.votes["student-1"] = { agree, comment: comment || (agree ? "현재 대안에 동의합니다." : "추가 보완이 필요합니다.") };
      this.save();
    }

    completeConsensusDemo() {
      this.quest.team.forEach((member) => {
        if (!this.quest.votes[member.id]) this.quest.votes[member.id] = {};
        this.quest.votes[member.id].agree = true;
        if (!this.quest.votes[member.id].comment) this.quest.votes[member.id].comment = "토의 후 최종대안에 동의했습니다.";
      });
      this.quest.institution.disclosed = true;
      this.quest.stage = Math.max(this.quest.stage, 6);
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
