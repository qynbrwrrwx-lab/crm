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

function getOpportunityMetricsPresentation(metrics) {
  return {
    countLabel: `${metrics.count} opportunité${metrics.count > 1 ? "s" : ""}`,
    pipelineLabel: opportunityCurrency(metrics.pipeline),
    forecastLabel: opportunityCurrency(metrics.forecast),
    proposalLabel: opportunityCurrency(metrics.proposal),
    wonLabel: opportunityCurrency(metrics.won),
    closingSoonCount: metrics.closingSoon
  };
}

function renderOpportunityMetrics(metrics) {
  const presentation = getOpportunityMetricsPresentation(metrics);
  const counters = [
    ["opportunitiesCount", presentation.countLabel],
    ["opportunitiesPipelineTotal", presentation.pipelineLabel],
    ["opportunitiesForecastTotal", presentation.forecastLabel],
    ["opportunitiesProposalTotal", presentation.proposalLabel],
    ["opportunitiesWonTotal", presentation.wonLabel],
    ["dashboardPipelineTotal", presentation.pipelineLabel],
    ["dashboardClosingOpportunities", presentation.closingSoonCount]
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

function getOpportunityCardPresentation(item, stage) {
  const isClosed = closedOpportunityStages.includes(stage);
  return {
    id: item._id,
    contactName: opportunityContactName(item),
    title: item.title,
    amountLabel: opportunityCurrency(item.amount),
    probabilityLabel: `${Number(item.probability || 0)} % de probabilité`,
    closeDateLabel: item.expectedCloseDate ? ` · Prévu le ${new Date(item.expectedCloseDate).toLocaleDateString("fr-FR")}` : "",
    canCreateQuote: Boolean(item.contactId && !isClosed),
    canMove: !isClosed
  };
}

function renderOpportunityCard(item, stage) {
  const card = getOpportunityCardPresentation(item, stage);
  const quoteAction = card.canCreateQuote ? `<button type="button" class="opportunity-quote-btn" onclick="createQuoteFromOpportunity('${card.id}')">Créer un devis</button>` : "";
  const moveAction = card.canMove ? `<select aria-label="Déplacer l’opportunité" onchange="moveOpportunity('${card.id}',this.value)"><option value="">Déplacer…</option>${renderOpportunityMoveOptions(stage)}</select>` : "";

  return `<article class="opportunity-card"><div><span>${escapeHtml(card.contactName)}</span><h3>${escapeHtml(card.title)}</h3><strong>${card.amountLabel}</strong><small>${card.probabilityLabel}${card.closeDateLabel}</small></div><div class="opportunity-card-actions">${quoteAction}<button type="button" onclick="editOpportunity('${card.id}')">Modifier</button>${moveAction}<button type="button" class="danger" onclick="deleteOpportunity('${card.id}')">Supprimer</button></div></article>`;
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
