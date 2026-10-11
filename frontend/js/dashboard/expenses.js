// Tableau de bord : expenses.

function getExpenseDashboardPresentation(invoices, expenses) {
  const paidExpenses = expenses
    .filter(expense => expense.status === "paid")
    .reduce((total, expense) => total + Number(expense.amountTTC || 0), 0);
  const pendingExpenses = expenses
    .filter(expense => expense.status !== "paid")
    .reduce((total, expense) => total + Number(expense.amountTTC || 0), 0);
  const paidRevenue = invoices
    .filter(invoice => invoice.type === "invoice" && invoice.paymentStatus === "paid")
    .reduce((total, invoice) => total + Number(invoice.totalTTC || 0), 0);
  return {
    paidExpensesLabel: formatCurrency(paidExpenses),
    pendingExpensesLabel: formatCurrency(pendingExpenses),
    estimatedMarginLabel: formatCurrency(paidRevenue - paidExpenses)
  };
}

function updateExpenseDashboard() {
  const expenses = typeof allExpenses === "undefined" ? [] : allExpenses;
  const invoices = typeof allInvoices === "undefined" ? [] : allInvoices;
  const presentation = getExpenseDashboardPresentation(invoices, expenses);
  const setValue = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };
  setValue("dashboardExpensesPaid", presentation.paidExpensesLabel);
  setValue("dashboardExpensesPending", presentation.pendingExpensesLabel);
  setValue("dashboardEstimatedMargin", presentation.estimatedMarginLabel);
  updateExpenseAlert(expenses);
  updateCashForecast();
}

function getCashForecastPresentation(invoices, expenses, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(today);
  deadline.setDate(deadline.getDate() + 30);
  const expectedIncome = invoices
    .filter(invoice => invoice.type === "invoice" && invoice.paymentStatus !== "paid" && invoice.paymentDueDate && new Date(invoice.paymentDueDate) >= today && new Date(invoice.paymentDueDate) <= deadline)
    .reduce((total, invoice) => {
      const paid = (invoice.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      return total + Math.max(0, Number(invoice.totalTTC || 0) - paid);
    }, 0);
  const expectedExpenses = expenses
    .filter(expense => expense.status !== "paid" && expense.dueDate && new Date(expense.dueDate) >= today && new Date(expense.dueDate) <= deadline)
    .reduce((total, expense) => total + Number(expense.amountTTC || 0), 0);
  const forecast = expectedIncome - expectedExpenses;
  return {
    valueLabel: formatCurrency(forecast),
    className: forecast >= 0 ? "is-positive" : "is-negative",
    detailLabel: `${formatCurrency(expectedIncome)} à encaisser · ${formatCurrency(expectedExpenses)} à décaisser d’ici 30 jours.`
  };
}

function updateCashForecast() {
  const element = document.getElementById("dashboardCashForecast");
  const detail = document.getElementById("dashboardCashForecastDetail");
  if (!element || !detail) return;
  const invoices = typeof allInvoices === "undefined" ? [] : allInvoices;
  const expenses = typeof allExpenses === "undefined" ? [] : allExpenses;
  const presentation = getCashForecastPresentation(invoices, expenses);
  element.textContent = presentation.valueLabel;
  element.className = presentation.className;
  detail.textContent = presentation.detailLabel;
}

function getExpenseAlertPresentation(expenses, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const overdue = expenses.filter(expense => {
    if (expense.status === "paid" || !expense.dueDate) return false;
    const dueDate = new Date(expense.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });
  if (!overdue.length) {
    return {
      label: "Aucune échéance fournisseur en retard",
      detail: "Les dépenses à payer seront suivies ici.",
      buttonLabel: "Voir",
      filter: null
    };
  }
  const total = overdue.reduce((sum, expense) => sum + Number(expense.amountTTC || 0), 0);
  return {
    label: `${overdue.length} échéance${overdue.length > 1 ? "s" : ""} fournisseur en retard`,
    detail: `${formatCurrency(total)} à régulariser.`,
    buttonLabel: "Gérer",
    filter: "overdue"
  };
}

function updateExpenseAlert(expenses) {
  const label = document.getElementById("dashboardExpenseAlertLabel");
  const detail = document.getElementById("dashboardExpenseAlertDetail");
  const button = document.getElementById("dashboardExpenseAlertButton");
  const dot = document.getElementById("dashboardExpenseAlertDot");
  if (!label || !detail || !button) return;
  const presentation = getExpenseAlertPresentation(expenses);
  label.textContent = presentation.label;
  detail.textContent = presentation.detail;
  button.textContent = presentation.buttonLabel;
  if (!presentation.filter) {
    button.onclick = () => showSection("expensesSection");
    dot?.classList.remove("overdue");
    return;
  }
  button.onclick = () => {
    showSection("expensesSection");
    setExpenseQuickFilter(presentation.filter);
  };
  dot?.classList.add("overdue");
}
