// Opportunités : rendu du pipeline.

const closedOpportunityStages = ["won", "lost"];
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

function opportunityAmount(item) {
  return Number(item.amount || 0);
}

function opportunityStageTotal(opportunities) {
  return opportunities.reduce((total, item) => total + opportunityAmount(item), 0);
}

function getOpportunityBoardMetrics(opportunities, now = new Date()) {
  const active = opportunities.filter(item => !closedOpportunityStages.includes(item.stage));
  const pipeline = opportunityStageTotal(active);
  const forecast = active.reduce((total, item) => total + opportunityAmount(item) * Number(item.probability || 0) / 100, 0);
  const closingSoon = active.filter(item => {
    if (!item.expectedCloseDate) return false;
    const delay = new Date(item.expectedCloseDate) - now;
    return delay >= 0 && delay <= THIRTY_DAYS_IN_MS;
  });

  return {
    count: opportunities.length,
    pipeline,
    forecast,
    proposal: opportunityStageTotal(opportunities.filter(item => item.stage === "proposal")),
    won: opportunityStageTotal(opportunities.filter(item => item.stage === "won")),
    closingSoon: closingSoon.length
  };
}

function renderOpportunityMetrics(metrics) {
  const counters = [
    ["opportunitiesCount", `${metrics.count} opportunité${metrics.count > 1 ? "s" : ""}`],
    ["opportunitiesPipelineTotal", opportunityCurrency(metrics.pipeline)],
    ["opportunitiesForecastTotal", opportunityCurrency(metrics.forecast)],
    ["opportunitiesProposalTotal", opportunityCurrency(metrics.proposal)],
    ["opportunitiesWonTotal", opportunityCurrency(metrics.won)],
    ["dashboardPipelineTotal", opportunityCurrency(metrics.pipeline)],
    ["dashboardClosingOpportunities", metrics.closingSoon]
  ];

  counters.forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
}

function renderOpportunityMoveOptions(stage) {
  return Object.entries(opportunityStages)
    .filter(([key]) => key !== stage)
    .map(([key, label]) => `<option value="${key}">${label}</option>`)
    .join("");
}

function renderOpportunityCard(item, stage) {
  const canCreateQuote = item.contactId && !closedOpportunityStages.includes(stage);
  const canMove = !closedOpportunityStages.includes(stage);
  const closeDate = item.expectedCloseDate ? ` · Prévu le ${new Date(item.expectedCloseDate).toLocaleDateString("fr-FR")}` : "";
  const quoteAction = canCreateQuote ? `<button type="button" class="opportunity-quote-btn" onclick="createQuoteFromOpportunity('${item._id}')">Créer un devis</button>` : "";
  const moveAction = canMove ? `<select aria-label="Déplacer l’opportunité" onchange="moveOpportunity('${item._id}',this.value)"><option value="">Déplacer…</option>${renderOpportunityMoveOptions(stage)}</select>` : "";

  return `<article class="opportunity-card"><div><span>${escapeHtml(opportunityContactName(item))}</span><h3>${escapeHtml(item.title)}</h3><strong>${opportunityCurrency(item.amount)}</strong><small>${Number(item.probability || 0)} % de probabilité${closeDate}</small></div><div class="opportunity-card-actions">${quoteAction}<button type="button" onclick="editOpportunity('${item._id}')">Modifier</button>${moveAction}<button type="button" class="danger" onclick="deleteOpportunity('${item._id}')">Supprimer</button></div></article>`;
}

function renderOpportunityColumn(stage, label, opportunities) {
  const content = opportunities.length
    ? opportunities.map(item => renderOpportunityCard(item, stage)).join("")
    : '<p class="opportunity-empty">Aucune opportunité</p>';
  return `<section class="opportunity-column stage-${stage}"><header><div><span>${label}</span><strong>${opportunityCurrency(opportunityStageTotal(opportunities))}</strong></div><b>${opportunities.length}</b></header><div>${content}</div></section>`;
}

function renderOpportunityBoard(opportunities) {
  const board = document.getElementById("opportunityBoard");
  if (!board) return;

  renderOpportunityMetrics(getOpportunityBoardMetrics(opportunities));
  board.innerHTML = Object.entries(opportunityStages)
    .map(([stage, label]) => renderOpportunityColumn(stage, label, opportunities.filter(item => item.stage === stage)))
    .join("");
}
