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

function getBusinessKpiPresentation(metrics) {
  return {
    quoteCount: metrics.quotes.length,
    orderCount: metrics.orders.length,
    pendingCount: metrics.pending.length,
    pendingTotalLabel: formatCurrency(metrics.pendingTotal),
    paidTotalLabel: formatCurrency(metrics.paidTotal)
  };
}

function updateBusinessKPI(invoices) {
  const metrics = getBusinessMetrics(invoices);
  const { pending, paid, overdue, overdueTotal } = metrics;
  const presentation = getBusinessKpiPresentation(metrics);

  document.getElementById("dashboardQuotes").innerText = presentation.quoteCount;
  document.getElementById("dashboardOrders").innerText = presentation.orderCount;
  document.getElementById("dashboardPendingInvoices").innerText = presentation.pendingCount;
  const pendingAlert = document.getElementById("dashboardPendingInvoicesAlert");
  if (pendingAlert) pendingAlert.innerText = presentation.pendingCount;
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
  document.getElementById("dashboardPendingTotal").innerText = presentation.pendingTotalLabel;
  document.getElementById("dashboardPaidTotal").innerText = presentation.paidTotalLabel;
  updateElectronicInvoicingAlert(invoices);
  updateCommercialInsights(invoices, paid);
  updateRecentActivity(invoices);
  updateExpenseDashboard();
  updateCashForecast();
}

function getStockKpiPresentation(products) {
  const { lowStock, outOfStock, stockValue, stockCost } = getStockMetrics(products);
  return {
    lowStock,
    outOfStock,
    count: products.length,
    valueLabel: formatCurrency(stockValue),
    valueDetail: `Valeur d’achat : ${formatCurrency(stockCost)} · Marge potentielle : ${formatCurrency(stockValue - stockCost)}`
  };
}

function updateStockKPI(products) {
  const presentation = getStockKpiPresentation(products);
  const element = document.getElementById("dashboardLowStock");
  if (element) element.innerText = presentation.lowStock;
  const lowStockAlert = document.getElementById("dashboardLowStockAlert");
  if (lowStockAlert) lowStockAlert.innerText = presentation.lowStock;
  const outOfStockElement = document.getElementById("dashboardOutOfStock");
  if (outOfStockElement) outOfStockElement.innerText = presentation.outOfStock;
  const valueElement = document.getElementById("dashboardStockValue");
  if (valueElement) valueElement.innerText = presentation.valueLabel;
  if (valueElement) valueElement.title = presentation.valueDetail;
  const countElement = document.getElementById("dashboardProductCount");
  if (countElement) countElement.innerText = presentation.count;
}
