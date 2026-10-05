// Trésorerie : propositions de rapprochement.

function getTreasuryReconciliationSuggestions(entries, invoices, expenses) {
  const imported = entries.filter(entry => entry.importFingerprint).slice(0, 30);
  const sameAmount = (left, right) => Math.abs(Number(left || 0) - Number(right || 0)) < 0.01;
  const suggestions = imported.map(entry => {
    if (entry.type === "income") {
      const invoice = invoices.find(item => item.type === "invoice" && item.paymentStatus !== "paid" && sameAmount(entry.amount, Number(item.totalTTC || 0) - (item.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0)));
      return invoice ? { entry, kind: "invoice", id: invoice._id, target: `Facture ${invoice.invoiceNumber || ""}`, detail: invoice.contactId?.companyName || "Facture à encaisser" } : null;
    }
    const expense = expenses.find(item => item.status !== "paid" && sameAmount(entry.amount, item.amountTTC));
    return expense ? { entry, kind: "expense", id: expense._id, target: expense.label, detail: expense.supplier || "Dépense à régler" } : null;
  }).filter(Boolean).slice(0, 5);
  return { imported, suggestions };
}
