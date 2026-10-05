// Produit le HTML de la fiche à partir de données explicites.
function renderInvoiceDetailBody(invoice, currentInvoice, isEditingQuote, presentation) {
  const { documentTypeLabel, invoiceDueState, electronicTransmission, documentStatus, statusClass, nextStep, linkedDocument, timelineSteps } = presentation;
  return `

  <div class="invoice-detail-card">

  ${renderInvoiceDetailSupplementarySections(invoice, currentInvoice, presentation)}

  ${renderInvoiceDetailHeader(invoice, presentation)}

${renderInvoicePaymentHistory(invoice)}

${renderInvoiceDetailProducts(currentInvoice, isEditingQuote)}

<div class="quote-footer">

    ${renderInvoiceDetailActions(invoice, isEditingQuote, linkedDocument)}

    ${renderInvoiceDetailSummary(currentInvoice)}

</div>

`;
}
