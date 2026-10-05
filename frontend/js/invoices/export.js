// invoices/export.js: fonctions extraites sans changement de comportement.

async function exportSalesCsv() {
  try {
    const documents = await apiFetch("/api/invoices");
    const salesDocuments = documents.filter(document =>
      ["invoice", "credit_note"].includes(document.type)
    );

    const lines = [
      ["Date", "Type", "Numero", "Client", "Total HT", "Total TTC", "Statut paiement", "Moyen de paiement", "Date paiement"],
      ...salesDocuments.map(document => [
        new Date(document.createdAt).toLocaleDateString("fr-FR"),
        document.type === "credit_note" ? "Avoir" : "Facture",
        document.invoiceNumber,
        document.contactId?.companyName || `${document.contactId?.firstname || ""} ${document.contactId?.lastname || ""}`.trim(),
        Number(document.totalHT || 0).toFixed(2),
        Number(document.totalTTC || 0).toFixed(2),
        document.paymentStatus === "paid" ? "Payee" : "En attente",
        document.paymentMethod || "",
        document.paidAt ? new Date(document.paidAt).toLocaleDateString("fr-FR") : ""
      ])
    ];

    downloadCsvFile(lines, "ventes");
  } catch (err) {
    showToast(err.message || "Impossible d'exporter les ventes");
  }
}
