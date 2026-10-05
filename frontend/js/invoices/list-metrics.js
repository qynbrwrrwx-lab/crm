// Documents commerciaux : compteurs de la liste.

function updateInvoiceListMetrics({ quotes, acceptedQuotes, orders, visibleInvoiceIds, paidTotal, pendingTotal, electronicReadyCount }, { search, status, electronicStatus, sort }) {
  const invoiceSummary = document.getElementById("invoiceSummary");
  if (invoiceSummary) invoiceSummary.textContent = `${visibleInvoiceIds.size} facture${visibleInvoiceIds.size > 1 ? "s" : ""}`;
  document.getElementById("paidInvoicesTotal").textContent = `${formatDocumentCurrency(paidTotal)} encaissé`;
  document.getElementById("pendingInvoicesTotal").textContent = `${formatDocumentCurrency(pendingTotal)} à encaisser`;
  const electronicCounter = document.getElementById("electronicInvoicesTotal");
  if (electronicCounter) {
    electronicCounter.textContent = `${electronicReadyCount} prête${electronicReadyCount > 1 ? "s" : ""} à transmettre`;
    electronicCounter.classList.toggle("is-active", electronicStatus === "ready");
  }
  document.getElementById("paidInvoicesTotal")?.classList.toggle("is-active", status === "paid");
  document.getElementById("pendingInvoicesTotal")?.classList.toggle("is-active", status === "pending");
  const resetButton = document.getElementById("resetInvoiceFilters");
  if (resetButton) resetButton.hidden = !(search || status !== "all" || electronicStatus !== "all" || sort !== "recent");
  const quotesCount = document.getElementById("quotesCount");
  if (quotesCount) quotesCount.textContent = `${quotes.length} devis`;
  const acceptedQuotesCount = document.getElementById("acceptedQuotesCount");
  if (acceptedQuotesCount) acceptedQuotesCount.textContent = `${acceptedQuotes.length} devis`;
  const ordersCount = document.getElementById("ordersCount");
  if (ordersCount) ordersCount.textContent = `${orders.length} commande${orders.length > 1 ? "s" : ""}`;
}
