// Clients : chargement et calculs de la fiche profil.

async function getClientProfileData(contact) {
  const contactId = contact._id;
  const documents = await apiFetch("/api/invoices");
  const agendaItems = typeof allTasks !== "undefined" ? allTasks : await apiFetch("/api/tasks");
  const opportunities = typeof allOpportunities !== "undefined" ? allOpportunities : await apiFetch("/api/opportunities");
  const related = documents.filter(document => String(document.contactId?._id || document.contactId) === contactId);
  const relatedAgenda = agendaItems.filter(item => String(item.contactId?._id || item.contactId) === contactId && item.status === "open").sort((left, right) => new Date(left.startDate || left.dueDate || 0) - new Date(right.startDate || right.dueDate || 0));
  const relatedOpportunities = opportunities.filter(item => String(item.contactId?._id || item.contactId) === contactId && !["won", "lost"].includes(item.stage));
  const paidInvoices = related.filter(document => document.type === "invoice" && document.paymentStatus === "paid");
  const total = paidInvoices.reduce((sum, document) => sum + Number(document.totalTTC || 0), 0);
  const pendingInvoices = related.filter(document => document.type === "invoice" && document.paymentStatus !== "paid");
  const pending = pendingInvoices.reduce((sum, document) => sum + Number(document.totalTTC || 0), 0);
  const pendingQuotes = related.filter(document => document.type === "quote" && !["accepted", "declined"].includes(document.status));
  const latest = [...related].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0];
  const firstPaidInvoice = [...paidInvoices].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt))[0];
  const nextAction = pendingInvoices.length ? { title: "Suivre le règlement", detail: `${formatCurrency(pending)} reste à encaisser sur ${pendingInvoices.length} facture${pendingInvoices.length > 1 ? "s" : ""}.`, action: "Voir les factures", target: "invoices" } : pendingQuotes.length ? { title: "Relancer le devis", detail: `${pendingQuotes.length} devis est en attente de décision.`, action: "Voir les devis", target: "quotes" } : { title: "Créer une nouvelle opportunité", detail: "Aucune action urgente : vous pouvez préparer un nouveau devis.", action: "Créer un devis", target: "create-quote" };
  return { firstPaidInvoice, latest, nextAction, paidInvoices, pending, pendingInvoices, related, relatedAgenda, relatedOpportunities, total };
}
