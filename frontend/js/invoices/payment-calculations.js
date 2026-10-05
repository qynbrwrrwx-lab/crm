// Documents commerciaux : calculs des règlements.

function getInvoicePaidAmount(invoice) {
  return (invoice.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}

function getInvoiceRemainingAmount(invoice) {
  return Math.max(0, Number(invoice.totalTTC || 0) - getInvoicePaidAmount(invoice));
}
