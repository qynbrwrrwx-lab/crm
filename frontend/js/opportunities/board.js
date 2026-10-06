// opportunities : board.

function renderOpportunities() {
  renderOpportunityBoard(allOpportunities);
}

function refreshOpportunityBoard() {
  opportunityContacts();
  renderOpportunities();
  renderOpportunityPerformanceMetrics();
  renderOpportunitySourceInsights();
  renderOpportunityLossInsights();
  updatePipelineDashboardDetails();
  addOpportunityFollowUpButtons();
  addOpportunityLossReasonLabels();
  markStaleOpportunities();
  enableOpportunityDragAndDrop();
}

async function loadOpportunities() {
  try {
    ensureOpportunitySourceField();
    ensureOpportunityLostReasonField();
    allOpportunities = await apiFetch("/api/opportunities");
    refreshOpportunityBoard();
  } catch (error) {
    console.error(error);
  }
}

function enableOpportunityCardDrag(card, item) {
  card.draggable = true;
  card.dataset.opportunityId = item._id;
  card.addEventListener("dragstart", event => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item._id);
    card.classList.add("is-dragging");
  });
  card.addEventListener("dragend", () => card.classList.remove("is-dragging"));
}

function enableOpportunityColumnDrop(column, stage) {
  column.addEventListener("dragover", event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    column.classList.add("is-drop-target");
  });
  column.addEventListener("dragleave", () => column.classList.remove("is-drop-target"));
  column.addEventListener("drop", event => {
    event.preventDefault();
    column.classList.remove("is-drop-target");
    const id = event.dataTransfer.getData("text/plain");
    const item = allOpportunities.find(entry => entry._id === id);
    if (item && item.stage !== stage) moveOpportunity(id, stage);
  });
}

function enableOpportunityDragAndDrop() {
  const stages = Object.keys(opportunityStages);
  const opportunities = getRenderedOpportunities();
  document.querySelectorAll(".opportunity-card").forEach((card, index) => {
    const item = opportunities[index];
    if (item) enableOpportunityCardDrag(card, item);
  });
  document.querySelectorAll(".opportunity-column").forEach((column, index) => {
    enableOpportunityColumnDrop(column, stages[index]);
  });
}
