// Clients : chargement et calculs de la fiche profil.

function getRelatedContactId(item) {
  return String(item.contactId?._id || item.contactId || "");
}

function getClientNextAction(pendingInvoices, pendingQuotes, pending) {
  if (pendingInvoices.length) {
    return {
      title: "Suivre le règlement",
      detail: `${formatCurrency(pending)} reste à encaisser sur ${pendingInvoices.length} facture${pendingInvoices.length > 1 ? "s" : ""}.`,
      action: "Voir les factures",
      target: "invoices"
    };
  }
  if (pendingQuotes.length) {
    return {
      title: "Relancer le devis",
      detail: `${pendingQuotes.length} devis est en attente de décision.`,
      action: "Voir les devis",
      target: "quotes"
    };
  }
  return {
    title: "Créer une nouvelle opportunité",
    detail: "Aucune action urgente : vous pouvez préparer un nouveau devis.",
    action: "Créer un devis",
    target: "create-quote"
  };
}

function getClientProfileDataFromResources(contact, { documents, agendaItems, opportunities }) {
  const contactId = String(contact._id);
  const related = documents.filter(document => getRelatedContactId(document) === contactId);
  const relatedAgenda = agendaItems
    .filter(item => getRelatedContactId(item) === contactId && item.status === "open")
    .sort((left, right) => new Date(left.startDate || left.dueDate || 0) - new Date(right.startDate || right.dueDate || 0));
  const relatedOpportunities = opportunities.filter(item => getRelatedContactId(item) === contactId && !["won", "lost"].includes(item.stage));
  const paidInvoices = related.filter(document => document.type === "invoice" && document.paymentStatus === "paid");
  const total = paidInvoices.reduce((sum, document) => sum + Number(document.totalTTC || 0), 0);
  const pendingInvoices = related.filter(document => document.type === "invoice" && document.paymentStatus !== "paid");
  const pending = pendingInvoices.reduce((sum, document) => sum + Number(document.totalTTC || 0), 0);
  const pendingQuotes = related.filter(document => document.type === "quote" && !["accepted", "declined"].includes(document.status));
  const latest = [...related].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0];
  const firstPaidInvoice = [...paidInvoices].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt))[0];
  const nextAction = getClientNextAction(pendingInvoices, pendingQuotes, pending);

  return { firstPaidInvoice, latest, nextAction, paidInvoices, pending, pendingInvoices, related, relatedAgenda, relatedOpportunities, total };
}

async function getClientProfileData(contact) {
  const documents = await apiFetch("/api/invoices");
  const agendaItems = typeof allTasks !== "undefined" ? allTasks : await apiFetch("/api/tasks");
  const opportunities = typeof allOpportunities !== "undefined" ? allOpportunities : await apiFetch("/api/opportunities");
  return getClientProfileDataFromResources(contact, { documents, agendaItems, opportunities });
}
