// Documents commerciaux : compteurs de la liste.

function getInvoiceListMetricsPresentation({ quotes, acceptedQuotes, orders, visibleInvoiceIds, paidTotal, pendingTotal, electronicReadyCount }, { search, status, electronicStatus, sort }) {
  return {
    invoiceSummaryLabel: `${visibleInvoiceIds.size} facture${visibleInvoiceIds.size > 1 ? "s" : ""}`,
    paidLabel: `${formatDocumentCurrency(paidTotal)} encaissé`,
    pendingLabel: `${formatDocumentCurrency(pendingTotal)} à encaisser`,
    electronicLabel: `${electronicReadyCount} prête${electronicReadyCount > 1 ? "s" : ""} à transmettre`,
    electronicActive: electronicStatus === "ready",
    paidActive: status === "paid",
    pendingActive: status === "pending",
    resetHidden: !(search || status !== "all" || electronicStatus !== "all" || sort !== "recent"),
    quotesLabel: `${quotes.length} devis`,
    acceptedQuotesLabel: `${acceptedQuotes.length} devis`,
    ordersLabel: `${orders.length} commande${orders.length > 1 ? "s" : ""}`
  };
}

function updateInvoiceListMetrics({ quotes, acceptedQuotes, orders, visibleInvoiceIds, paidTotal, pendingTotal, electronicReadyCount }, { search, status, electronicStatus, sort }) {
  const presentation = getInvoiceListMetricsPresentation({ quotes, acceptedQuotes, orders, visibleInvoiceIds, paidTotal, pendingTotal, electronicReadyCount }, { search, status, electronicStatus, sort });
  const invoiceSummary = document.getElementById("invoiceSummary");
  if (invoiceSummary) invoiceSummary.textContent = presentation.invoiceSummaryLabel;
  document.getElementById("paidInvoicesTotal").textContent = presentation.paidLabel;
  document.getElementById("pendingInvoicesTotal").textContent = presentation.pendingLabel;
  const electronicCounter = document.getElementById("electronicInvoicesTotal");
  if (electronicCounter) {
    electronicCounter.textContent = presentation.electronicLabel;
    electronicCounter.classList.toggle("is-active", presentation.electronicActive);
  }
  document.getElementById("paidInvoicesTotal")?.classList.toggle("is-active", presentation.paidActive);
  document.getElementById("pendingInvoicesTotal")?.classList.toggle("is-active", presentation.pendingActive);
  const resetButton = document.getElementById("resetInvoiceFilters");
  if (resetButton) resetButton.hidden = presentation.resetHidden;
  const quotesCount = document.getElementById("quotesCount");
  if (quotesCount) quotesCount.textContent = presentation.quotesLabel;
  const acceptedQuotesCount = document.getElementById("acceptedQuotesCount");
  if (acceptedQuotesCount) acceptedQuotesCount.textContent = presentation.acceptedQuotesLabel;
  const ordersCount = document.getElementById("ordersCount");
  if (ordersCount) ordersCount.textContent = presentation.ordersLabel;
}
