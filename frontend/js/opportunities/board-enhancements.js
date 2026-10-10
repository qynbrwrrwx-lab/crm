// Opportunités : enrichissements visuels des cartes.

function getOpportunityCardContent(card) {
  return card.querySelector(".opportunity-card>div");
}

function appendOpportunityCardLabel(card, className, text) {
  const label = document.createElement("small");
  label.className = className;
  label.textContent = text;
  getOpportunityCardContent(card)?.appendChild(label);
}

function canCreateOpportunityFollowUp(item) {
  return Boolean(item && !closedOpportunityStages.includes(item.stage) && item.contactId);
}

function getOpportunityLossReasonLabel(item) {
  if (item?.stage !== "lost" || !item.lostReason) return "";
  return `Motif : ${opportunityLostReasons[item.lostReason] || item.lostReason}`;
}

function isOpportunityStale(item, now = Date.now()) {
  if (!item || closedOpportunityStages.includes(item.stage)) return false;
  const updatedAt = new Date(item.updatedAt || item.createdAt).getTime();
  return updatedAt < now - 14 * 86400000;
}

function addOpportunityFollowUpButtons() {
  const opportunities = getRenderedOpportunities();
  document.querySelectorAll(".opportunity-card-actions").forEach((actions, index) => {
    const item = opportunities[index];
    if (!canCreateOpportunityFollowUp(item)) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "opportunity-followup-btn";
    button.textContent = "Planifier une relance";
    button.onclick = () => createOpportunityFollowUp(item);
    actions.prepend(button);
  });
}

function addOpportunityLossReasonLabels() {
  const opportunities = getRenderedOpportunities();
  document.querySelectorAll(".opportunity-card").forEach((card, index) => {
    const item = opportunities[index];
    const label = getOpportunityLossReasonLabel(item);
    if (label) appendOpportunityCardLabel(card, "opportunity-stale-indicator opportunity-loss-reason", label);
  });
}

function markStaleOpportunities() {
  const opportunities = getRenderedOpportunities();
  document.querySelectorAll(".opportunity-card").forEach((card, index) => {
    const item = opportunities[index];
    if (!isOpportunityStale(item)) return;

    card.classList.add("is-stale");
    appendOpportunityCardLabel(card, "opportunity-stale-indicator", "À relancer : aucune mise à jour depuis 14 jours");
  });
}
