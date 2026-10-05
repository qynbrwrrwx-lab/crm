// Historique et totaux financiers de la fiche document.
function renderInvoicePaymentHistory(invoice) {
  if (invoice.type !== "invoice" || !(invoice.payments?.length || invoice.paidAt)) return "";
  const payments = invoice.payments?.length
    ? invoice.payments
    : [{ amount: invoice.totalTTC, method: invoice.paymentMethod, paidAt: invoice.paidAt }];

  return `<section class="payment-history">
    <h4>Historique du paiement</h4>
    ${payments.map(payment => `<div class="payment-history-row">
      <span>${escapeHtml(payment.method || "Paiement")}</span>
      <small>${new Date(payment.paidAt).toLocaleDateString("fr-FR")}</small>
      <strong>${Number(payment.amount || 0).toFixed(2)} EUR</strong>
    </div>`).join("")}
  </section>`;
}

function renderInvoiceDetailSummary(invoice) {
  return `<div class="quote-summary">
    <div class="summary-row"><span>Sous-total HT</span><strong id="summaryTotalHT">${formatDocumentCurrency(invoice.totalHT)}</strong></div>
    <div class="summary-row"><span>Remises</span><strong>0,00 €</strong></div>
    <div class="summary-row"><span>TVA</span><strong id="summaryTVA">${formatDocumentCurrency(invoice.totalTTC - invoice.totalHT)}</strong></div>
    <div class="summary-total"><span>TOTAL TTC</span><strong id="summaryTotalTTC">${formatDocumentCurrency(invoice.totalTTC)}</strong></div>
  </div>`;
}
