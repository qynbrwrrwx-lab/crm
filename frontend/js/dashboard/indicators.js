// Tableau de bord : mise à jour des indicateurs.
function updateKPI(contacts) {
  document.getElementById("total").innerText = contacts.length;
}

function getPaymentAlertPresentation({ pending, overdue, overdueTotal }) {
  if (overdue.length) {
    return {
      label: `${overdue.length} facture${overdue.length > 1 ? "s" : ""} en retard`,
      detail: `${formatCurrency(overdueTotal)} à relancer en priorité.`,
      filter: "overdue",
      isOverdue: true
    };
  }
  return {
    label: `<span id="dashboardPendingInvoicesAlert">${pending.length}</span> facture(s) à encaisser`,
    detail: "Suivez vos règlements en attente.",
    filter: "pending",
    isOverdue: false
  };
}

function updateBusinessKPI(invoices) {
  const { quotes, orders, pending, paid, overdue, pendingTotal, paidTotal, overdueTotal } = getBusinessMetrics(invoices);

  document.getElementById("dashboardQuotes").innerText = quotes.length;
  document.getElementById("dashboardOrders").innerText = orders.length;
  document.getElementById("dashboardPendingInvoices").innerText = pending.length;
  const pendingAlert = document.getElementById("dashboardPendingInvoicesAlert");
  if (pendingAlert) pendingAlert.innerText = pending.length;
  const paymentAlertLabel = document.getElementById("dashboardPaymentAlertLabel");
  const paymentAlertDetail = document.getElementById("dashboardPaymentAlertDetail");
  const paymentAlertDot = document.getElementById("dashboardPaymentAlertDot");
  const paymentAlertButton = document.getElementById("dashboardPaymentAlertButton");
  const paymentAlert = getPaymentAlertPresentation({ pending, overdue, overdueTotal });
  if (paymentAlertButton) {
    paymentAlertButton.onclick = () => {
      showSection("invoicesSection");
      setInvoiceQuickFilter(paymentAlert.filter);
    };
  }
  if (paymentAlert.isOverdue) {
    if (paymentAlertLabel) paymentAlertLabel.textContent = paymentAlert.label;
    if (paymentAlertDetail) paymentAlertDetail.textContent = paymentAlert.detail;
    paymentAlertDot?.classList.add("overdue");
  } else {
    if (paymentAlertLabel) paymentAlertLabel.innerHTML = paymentAlert.label;
    if (paymentAlertDetail) paymentAlertDetail.textContent = paymentAlert.detail;
    paymentAlertDot?.classList.remove("overdue");
  }
  document.getElementById("dashboardPendingTotal").innerText = formatCurrency(pendingTotal);
  document.getElementById("dashboardPaidTotal").innerText = formatCurrency(paidTotal);
  updateElectronicInvoicingAlert(invoices);
  updateCommercialInsights(invoices, paid);
  updateRecentActivity(invoices);
  updateExpenseDashboard();
  updateCashForecast();
}

function updateStockKPI(products) {
  const { lowStock, outOfStock, stockValue, stockCost } = getStockMetrics(products);
  const element = document.getElementById("dashboardLowStock");
  if (element) element.innerText = lowStock;
  const lowStockAlert = document.getElementById("dashboardLowStockAlert");
  if (lowStockAlert) lowStockAlert.innerText = lowStock;
  const outOfStockElement = document.getElementById("dashboardOutOfStock");
  if (outOfStockElement) outOfStockElement.innerText = outOfStock;
  const valueElement = document.getElementById("dashboardStockValue");
  if (valueElement) valueElement.innerText = formatCurrency(stockValue);
  if (valueElement) valueElement.title = `Valeur d’achat : ${formatCurrency(stockCost)} · Marge potentielle : ${formatCurrency(stockValue - stockCost)}`;
  const countElement = document.getElementById("dashboardProductCount");
  if (countElement) countElement.innerText = products.length;
}
