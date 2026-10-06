// opportunities : insights.

const opportunitySourceLabels = {
  manual: "Saisie manuelle",
  website: "Site internet",
  referral: "Recommandation",
  network: "Réseau / salon",
  advertising: "Publicité",
  other: "Autre"
};

function opportunityCountLabel(count) {
  return `${count} opportunité${count > 1 ? "s" : ""}`;
}

function getOpportunityPerformanceMetrics(opportunities) {
  const won = opportunities.filter(item => item.stage === "won");
  const closed = opportunities.filter(item => ["won", "lost"].includes(item.stage));
  return {
    conversion: closed.length ? Math.round(won.length / closed.length * 100) : null,
    averageWon: won.length ? won.reduce((total, item) => total + Number(item.amount || 0), 0) / won.length : 0
  };
}

function getOpportunitySourceInsights(opportunities) {
  const sources = opportunities.reduce((result, item) => {
    const source = item.source || "manual";
    result[source] ??= { count: 0, amount: 0 };
    result[source].count++;
    result[source].amount += Number(item.amount || 0);
    return result;
  }, {});
  return Object.entries(sources).sort(([, first], [, second]) => second.amount - first.amount).slice(0, 4);
}

function getOpportunityLossInsights(opportunities) {
  const lost = opportunities.filter(item => item.stage === "lost");
  const reasons = lost.reduce((result, item) => {
    const reason = item.lostReason || "unreported";
    result[reason] = (result[reason] || 0) + 1;
    return result;
  }, {});
  return { total: lost.length, entries: Object.entries(reasons).sort(([, first], [, second]) => second - first).slice(0, 4) };
}

function getStaleOpportunityCount(opportunities, now = Date.now()) {
  const threshold = now - 14 * 86400000;
  return opportunities.filter(item => !["won", "lost"].includes(item.stage) && new Date(item.updatedAt || item.createdAt).getTime() < threshold).length;
}

function ensureOpportunityPerformanceElements() {
  const summary = document.querySelector(".opportunity-summary");
  if (!summary) return {};

  let conversion = document.getElementById("opportunityWinRate");
  let average = document.getElementById("opportunityAverageWon");
  if (!conversion || !average) {
    summary.insertAdjacentHTML("beforeend", '<div><span>Taux de conversion</span><strong id="opportunityWinRate">—</strong></div><div><span>Panier moyen gagné</span><strong id="opportunityAverageWon">0,00 €</strong></div>');
    conversion = document.getElementById("opportunityWinRate");
    average = document.getElementById("opportunityAverageWon");
  }
  return { conversion, average };
}

function renderOpportunityPerformanceMetrics() {
  const { conversion, average } = ensureOpportunityPerformanceElements();
  if (!conversion || !average) return;

  const metrics = getOpportunityPerformanceMetrics(allOpportunities);
  conversion.textContent = metrics.conversion === null ? "—" : `${metrics.conversion} %`;
  average.textContent = opportunityCurrency(metrics.averageWon);
}

function renderOpportunitySourceInsights() {
  const root = document.getElementById("opportunitySourceInsights");
  if (!root) return;

  const sources = getOpportunitySourceInsights(allOpportunities);
  root.innerHTML = sources.length
    ? `<span>Origine des opportunités</span><div>${sources.map(([source, data]) => `<article><strong>${escapeHtml(opportunitySourceLabels[source] || source)}</strong><small>${opportunityCountLabel(data.count)}</small><b>${opportunityCurrency(data.amount)}</b></article>`).join("")}</div>`
    : "";
}

function getOpportunityLossInsightsRoot() {
  const sourceRoot = document.getElementById("opportunitySourceInsights");
  if (!sourceRoot) return null;

  let root = document.getElementById("opportunityLossInsights");
  if (!root) {
    root = document.createElement("section");
    root.id = "opportunityLossInsights";
    root.className = "opportunity-source-insights";
    sourceRoot.insertAdjacentElement("afterend", root);
  }
  return root;
}

function renderOpportunityLossInsights() {
  const sourceRoot = document.getElementById("opportunitySourceInsights");
  if (!sourceRoot) return;

  const existingRoot = document.getElementById("opportunityLossInsights");
  const { total, entries } = getOpportunityLossInsights(allOpportunities);
  if (!entries.length) {
    existingRoot?.remove();
    return;
  }

  const root = existingRoot || getOpportunityLossInsightsRoot();
  if (!root) return;
  root.innerHTML = `<span>Pourquoi les opportunités sont perdues</span><div>${entries.map(([reason, count]) => `<article><strong>${escapeHtml(reason === "unreported" ? "Non renseigné" : opportunityLostReasons[reason] || reason)}</strong><small>${opportunityCountLabel(count)}</small><b>${Math.round(count / Math.max(1, total) * 100)} %</b></article>`).join("")}</div>`;
}

function updatePipelineDashboardDetails() {
  const detail = document.getElementById("dashboardPipelineDetail");
  if (!detail) return;

  const stale = getStaleOpportunityCount(allOpportunities);
  detail.textContent = stale ? `${opportunityCountLabel(stale)} à relancer` : "Valeur des opportunités actives";
}
