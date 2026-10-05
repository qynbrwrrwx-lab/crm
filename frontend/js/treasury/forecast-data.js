// Trésorerie : flux attendus sur les trente prochains jours.

function getTreasuryForecastData(currentBalance, invoices, expenses, now = new Date()) {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const deadline = new Date(start); deadline.setDate(deadline.getDate() + 30);
  const incomeItems = invoices.filter(invoice => invoice.type === "invoice" && invoice.paymentStatus !== "paid" && invoice.paymentDueDate && new Date(invoice.paymentDueDate) >= start && new Date(invoice.paymentDueDate) <= deadline)
    .map(invoice => ({ type: "income", date: invoice.paymentDueDate, label: `Facture ${invoice.invoiceNumber || ""}`.trim(), amount: Math.max(0, Number(invoice.totalTTC || 0) - (invoice.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0)) }));
  const expenseItems = expenses.filter(expense => expense.status !== "paid" && expense.dueDate && new Date(expense.dueDate) >= start && new Date(expense.dueDate) <= deadline)
    .map(expense => ({ type: "expense", date: expense.dueDate, label: expense.label, detail: expense.supplier, amount: Number(expense.amountTTC || 0) }));
  const items = [...incomeItems, ...expenseItems].filter(item => item.amount > 0).sort((left, right) => new Date(left.date) - new Date(right.date));
  const income = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const expense = expenseItems.reduce((sum, item) => sum + item.amount, 0);
  return { items, income, expense, projected: currentBalance + income - expense };
}
