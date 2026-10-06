// Facturation : préparation et téléchargement de l'export des ventes.

const salesCsvHeaders = ["Date", "Type", "Numero", "Client", "Total HT", "Total TTC", "Statut paiement", "Moyen de paiement", "Date paiement"];

function isSalesDocument(document) {
  return ["invoice", "credit_note"].includes(document.type);
}

function getSalesCsvLines(documents) {
  const salesDocuments = documents.filter(isSalesDocument);
  return [salesCsvHeaders, ...salesDocuments.map(document => [
    new Date(document.createdAt).toLocaleDateString("fr-FR"),
    document.type === "credit_note" ? "Avoir" : "Facture",
    document.invoiceNumber,
    document.contactId?.companyName || `${document.contactId?.firstname || ""} ${document.contactId?.lastname || ""}`.trim(),
    Number(document.totalHT || 0).toFixed(2),
    Number(document.totalTTC || 0).toFixed(2),
    document.paymentStatus === "paid" ? "Payee" : "En attente",
    document.paymentMethod || "",
    document.paidAt ? new Date(document.paidAt).toLocaleDateString("fr-FR") : ""
  ])];
}

async function exportSalesCsv() {
  try {
    const documents = await apiFetch("/api/invoices");
    downloadCsvFile(getSalesCsvLines(documents), "ventes");
  } catch (error) {
    showToast(error.message || "Impossible d'exporter les ventes");
  }
}
