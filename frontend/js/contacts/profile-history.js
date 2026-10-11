// Clients : activités, opportunités et historique commercial.

const clientProfileDocumentTypes = { quote: "Devis", order: "Commande", invoice: "Facture", credit_note: "Avoir" };
const clientProfileOpportunityStages = { lead: "Prospect", qualified: "Qualifié", proposal: "Proposition" };

function renderClientProfileHistoryHeading(eyebrow, title, countLabel) {
  return `<div class="client-profile-documents-heading"><div><p class="form-eyebrow">${eyebrow}</p><h4>${title}</h4></div><span>${countLabel}</span></div>`;
}

function renderClientAgendaDate(item) {
  if (item.startDate) return new Date(item.startDate).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  if (item.dueDate) return new Date(item.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  return "Sans date";
}

function getClientAgendaItemPresentation(item) {
  return {
    id: item._id,
    typeLabel: item.type === "appointment" ? "Rendez-vous" : "Tâche",
    title: item.title,
    dateLabel: renderClientAgendaDate(item),
    priorityLabel: item.priority === "high" ? "Prioritaire" : "À suivre"
  };
}

function renderClientAgendaItem(item) {
  const presentation = getClientAgendaItemPresentation(item);
  return `<button type="button" class="client-profile-document" onclick="openAgendaItem('${presentation.id}')"><span class="client-profile-document-type">${presentation.typeLabel}</span><span class="client-profile-document-main"><strong>${escapeHtml(presentation.title)}</strong><small>${presentation.dateLabel}</small></span><strong class="client-profile-document-total">${presentation.priorityLabel}</strong></button>`;
}

function getClientOpportunityItemPresentation(item) {
  return {
    id: item._id,
    stageLabel: clientProfileOpportunityStages[item.stage] || "Opportunité",
    title: item.title,
    dateLabel: item.expectedCloseDate ? `Prévu le ${new Date(item.expectedCloseDate).toLocaleDateString("fr-FR")}` : "Date à préciser",
    amountLabel: formatCurrency(item.amount)
  };
}

function renderClientOpportunityItem(item) {
  const presentation = getClientOpportunityItemPresentation(item);
  return `<button type="button" class="client-profile-document" onclick="openOpportunityFromProfile('${presentation.id}')"><span class="client-profile-document-type">${escapeHtml(presentation.stageLabel)}</span><span class="client-profile-document-main"><strong>${escapeHtml(presentation.title)}</strong><small>${presentation.dateLabel}</small></span><strong class="client-profile-document-total">${presentation.amountLabel}</strong></button>`;
}

function getClientDocumentItemPresentation(document) {
  return {
    id: document._id,
    typeLabel: clientProfileDocumentTypes[document.type] || "Document",
    number: document.invoiceNumber || "Sans numéro",
    dateLabel: new Date(document.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
    totalLabel: formatCurrency(document.totalTTC)
  };
}

function renderClientDocumentItem(document) {
  const presentation = getClientDocumentItemPresentation(document);
  return `<button type="button" class="client-profile-document" onclick="openInvoice('${presentation.id}')"><span class="client-profile-document-type">${escapeHtml(presentation.typeLabel)}</span><span class="client-profile-document-main"><strong>${escapeHtml(presentation.number)}</strong><small>${presentation.dateLabel}</small></span><strong class="client-profile-document-total">${presentation.totalLabel}</strong></button>`;
}

function renderClientProfileHistorySection({ className = "", eyebrow, title, countLabel, items, renderItem, limit, emptyMessage }) {
  const content = items.length
    ? `<div class="client-profile-document-list">${items.slice(0, limit).map(renderItem).join("")}</div>`
    : `<p class="empty-state">${emptyMessage}</p>`;
  return `<section class="client-profile-documents ${className}">${renderClientProfileHistoryHeading(eyebrow, title, countLabel)}${content}</section>`;
}

function renderClientProfileHistory({ relatedAgenda, relatedOpportunities, related }) {
  const agenda = renderClientProfileHistorySection({
    className: "client-profile-agenda",
    eyebrow: "Suivi relationnel",
    title: "Prochaines actions",
    countLabel: `${relatedAgenda.length} à venir`,
    items: relatedAgenda,
    renderItem: renderClientAgendaItem,
    limit: 4,
    emptyMessage: "Aucun rendez-vous ou tâche à venir pour ce client."
  });
  const opportunities = renderClientProfileHistorySection({
    className: "client-profile-opportunities",
    eyebrow: "Pipeline commercial",
    title: "Opportunités en cours",
    countLabel: `${relatedOpportunities.length} active${relatedOpportunities.length > 1 ? "s" : ""}`,
    items: relatedOpportunities,
    renderItem: renderClientOpportunityItem,
    limit: 4,
    emptyMessage: "Aucune opportunité commerciale en cours."
  });
  const documents = renderClientProfileHistorySection({
    eyebrow: "Relation commerciale",
    title: "Historique des documents",
    countLabel: `${related.length} au total`,
    items: related,
    renderItem: renderClientDocumentItem,
    limit: 8,
    emptyMessage: "Aucun événement commercial pour ce client."
  });
  return `${agenda}${opportunities}${documents}`;
}
