(() => {
  "use strict";

  function initInstitutionInsightsEntry() {
    const params = new URLSearchParams(window.location.search);
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem("ttai_demo_session") || "{}"); } catch (_) {}
    const role = params.get("role") || stored.role || "student";
    const allowed = ["school", "district", "province", "admin"];
    if (!allowed.includes(role)) return;

    const services = document.getElementById("services");
    if (!services || services.querySelector('[data-service="institution-insights"]')) return;

    const card = document.createElement("a");
    card.className = "service";
    card.dataset.service = "institution-insights";
    card.href = "./services/institution-ai-insights.html?role=" + encodeURIComponent(role);
    card.innerHTML = '<div class="sicon">📊</div><h3>AI 성장·정책 분석</h3><p>질문력·창조력·연결력·공감력과 교과 성취 데이터를 분석하고 자연어로 질의합니다.</p><footer>분석 대시보드 열기 →</footer>';
    services.prepend(card);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initInstitutionInsightsEntry);
  else initInstitutionInsightsEntry();
})();
