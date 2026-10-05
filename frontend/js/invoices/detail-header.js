// Documents commerciaux : en-tête partagé de la fiche de détail.

function renderInvoiceDetailHeader(invoice, presentation) {
  const { clientName, documentInfo, documentTerms } = presentation;
  const documentDateLabel = invoice.type === "quote"
    ? "Date du devis"
    : invoice.type === "order"
      ? "Date de la commande"
      : invoice.type === "credit_note"
        ? "Date de l'avoir"
        : "Date de la facture";

  return `
    <div class="quote-header">
      <div class="quote-header-left">
        <p><strong>Client</strong><br>${escapeHtml(clientName)}</p>
        <p><strong>${documentDateLabel}</strong><br>${new Date(invoice.createdAt).toLocaleDateString("fr-FR")}</p>
      </div>
      <div class="quote-header-right">
        <p><strong>N°</strong><br>${escapeHtml(invoice.invoiceNumber)}</p>
        ${documentTerms ? `<p><strong>${documentTerms.label}</strong><br>${escapeHtml(documentTerms.value)}</p>` : ""}
        ${invoice.type === "invoice" && invoice.paymentDueDate ? `<p><strong>Échéance</strong><br>${new Date(invoice.paymentDueDate).toLocaleDateString("fr-FR")}</p>` : ""}
        ${invoice.type === "credit_note" && invoice.sourceDocumentId?.invoiceNumber ? `<p><strong>Facture d'origine</strong><br>${escapeHtml(invoice.sourceDocumentId.invoiceNumber)}</p>` : ""}
        <p><strong>${documentInfo.label}</strong><br>${escapeHtml(documentInfo.value)}</p>
      </div>
    </div>`;
}
