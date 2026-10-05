// Tableau de bord : expenses.

function updateExpenseDashboard() {
  const expenses = typeof allExpenses === "undefined" ? [] : allExpenses;
  const paidExpenses = expenses
    .filter(expense => expense.status === "paid")
    .reduce((total, expense) => total + Number(expense.amountTTC || 0), 0);
  const pendingExpenses = expenses
    .filter(expense => expense.status !== "paid")
    .reduce((total, expense) => total + Number(expense.amountTTC || 0), 0);
  const paidRevenue = (typeof allInvoices === "undefined" ? [] : allInvoices)
    .filter(invoice => invoice.type === "invoice" && invoice.paymentStatus === "paid")
    .reduce((total, invoice) => total + Number(invoice.totalTTC || 0), 0);
  const setValue = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = formatCurrency(value);
  };
  setValue("dashboardExpensesPaid", paidExpenses);
  setValue("dashboardExpensesPending", pendingExpenses);
  setValue("dashboardEstimatedMargin", paidRevenue - paidExpenses);
  updateExpenseAlert(expenses);
  updateCashForecast();
}

function updateCashForecast() {
  const element = document.getElementById("dashboardCashForecast");
  const detail = document.getElementById("dashboardCashForecastDetail");
  if (!element || !detail) return;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadline = new Date(now);
  deadline.setDate(deadline.getDate() + 30);
  const invoices = typeof allInvoices === "undefined" ? [] : allInvoices;
  const expenses = typeof allExpenses === "undefined" ? [] : allExpenses;
  const expectedIncome = invoices
    .filter(invoice => invoice.type === "invoice" && invoice.paymentStatus !== "paid" && invoice.paymentDueDate && new Date(invoice.paymentDueDate) >= now && new Date(invoice.paymentDueDate) <= deadline)
    .reduce((total, invoice) => {
      const paid = (invoice.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      return total + Math.max(0, Number(invoice.totalTTC || 0) - paid);
    }, 0);
  const expectedExpenses = expenses
    .filter(expense => expense.status !== "paid" && expense.dueDate && new Date(expense.dueDate) >= now && new Date(expense.dueDate) <= deadline)
    .reduce((total, expense) => total + Number(expense.amountTTC || 0), 0);
  const forecast = expectedIncome - expectedExpenses;
  element.textContent = formatCurrency(forecast);
  element.className = forecast >= 0 ? "is-positive" : "is-negative";
  detail.textContent = `${formatCurrency(expectedIncome)} à encaisser · ${formatCurrency(expectedExpenses)} à décaisser d’ici 30 jours.`;
}

function updateExpenseAlert(expenses) {
  const label = document.getElementById("dashboardExpenseAlertLabel");
  const detail = document.getElementById("dashboardExpenseAlertDetail");
  const button = document.getElementById("dashboardExpenseAlertButton");
  const dot = document.getElementById("dashboardExpenseAlertDot");
  if (!label || !detail || !button) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = expenses.filter(expense => {
    if (expense.status === "paid" || !expense.dueDate) return false;
    const dueDate = new Date(expense.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });
  if (!overdue.length) {
    label.textContent = "Aucune échéance fournisseur en retard";
    detail.textContent = "Les dépenses à payer seront suivies ici.";
    button.textContent = "Voir";
    button.onclick = () => showSection("expensesSection");
    dot?.classList.remove("overdue");
    return;
  }
  const total = overdue.reduce((sum, expense) => sum + Number(expense.amountTTC || 0), 0);
  label.textContent = `${overdue.length} échéance${overdue.length > 1 ? "s" : ""} fournisseur en retard`;
  detail.textContent = `${formatCurrency(total)} à régulariser.`;
  button.textContent = "Gérer";
  button.onclick = () => {
    showSection("expensesSection");
    setExpenseQuickFilter("overdue");
  };
  dot?.classList.add("overdue");
}
