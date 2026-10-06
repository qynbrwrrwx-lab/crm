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

function addOpportunityFollowUpButtons() {
  const opportunities = getRenderedOpportunities();
  document.querySelectorAll(".opportunity-card-actions").forEach((actions, index) => {
    const item = opportunities[index];
    if (!item || ["won", "lost"].includes(item.stage) || !item.contactId) return;

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
    if (item?.stage !== "lost" || !item.lostReason) return;

    appendOpportunityCardLabel(card, "opportunity-stale-indicator opportunity-loss-reason", `Motif : ${opportunityLostReasons[item.lostReason] || item.lostReason}`);
  });
}

function markStaleOpportunities() {
  const opportunities = getRenderedOpportunities();
  const threshold = Date.now() - 14 * 86400000;
  document.querySelectorAll(".opportunity-card").forEach((card, index) => {
    const item = opportunities[index];
    const updatedAt = new Date(item?.updatedAt || item?.createdAt).getTime();
    if (!item || ["won", "lost"].includes(item.stage) || updatedAt >= threshold) return;

    card.classList.add("is-stale");
    appendOpportunityCardLabel(card, "opportunity-stale-indicator", "À relancer : aucune mise à jour depuis 14 jours");
  });
}
