// Tableau de bord : mise à jour des indicateurs.
function updateKPI(contacts) {
  document.getElementById("total").innerText = contacts.length;
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
  if (paymentAlertButton) {
    paymentAlertButton.onclick = () => {
      showSection("invoicesSection");
      setInvoiceQuickFilter(overdue.length ? "overdue" : "pending");
    };
  }
  if (overdue.length) {
    if (paymentAlertLabel) paymentAlertLabel.textContent = `${overdue.length} facture${overdue.length > 1 ? "s" : ""} en retard`;
    if (paymentAlertDetail) paymentAlertDetail.textContent = `${formatCurrency(overdueTotal)} à relancer en priorité.`;
    paymentAlertDot?.classList.add("overdue");
  } else {
    if (paymentAlertLabel) paymentAlertLabel.innerHTML = `<span id="dashboardPendingInvoicesAlert">${pending.length}</span> facture(s) à encaisser`;
    if (paymentAlertDetail) paymentAlertDetail.textContent = "Suivez vos règlements en attente.";
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
