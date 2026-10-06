// Documents commerciaux : list. Voir README.md pour les responsabilités.

async function loadInvoices() {
  try {
    const invoices = await apiFetch("/api/invoices");
    allInvoices = invoices;
    renderTreasury?.();
    renderInvoices(invoices);
    updateBusinessKPI(invoices);
  } catch (error) {
    console.error(error);
    showToast(error.message);
  }
}

function filterInvoices() {
  renderInvoices(allInvoices);
}

function setInvoiceQuickFilter(status) {
  const filter = document.getElementById("invoiceStatusFilter");
  if (!filter) return;
  filter.value = filter.value === status ? "all" : status;
  filterInvoices();
}

function setElectronicInvoiceQuickFilter(status) {
  const filter = document.getElementById("electronicInvoiceStatusFilter");
  if (!filter) return;
  filter.value = filter.value === status ? "all" : status;
  filterInvoices();
}

function resetInvoiceFilters() {
  const search = resetInvoiceListFilterFields();
  filterInvoices();
  search?.focus();
}

function getInvoiceListContainers() {
  return {
    invoices: document.getElementById("invoiceList"),
    quotes: document.getElementById("quotesContainer"),
    acceptedQuotes: document.getElementById("acceptedQuotesContainer"),
    orders: document.getElementById("ordersContainer")
  };
}

function clearInvoiceListContainers(containers) {
  containers.invoices.innerHTML = "";
  containers.quotes.innerHTML = "";
  containers.acceptedQuotes.innerHTML = "";
  if (containers.orders) containers.orders.innerHTML = "";
}

function appendInvoiceListRow(containers, invoice, visibleInvoiceIds) {
  const html = renderInvoiceListRow(invoice);
  if (invoice.type === "quote") {
    const target = invoice.status === "accepted" ? containers.acceptedQuotes : containers.quotes;
    target.innerHTML += html;
    return;
  }
  if (invoice.type === "order") {
    if (containers.orders) containers.orders.innerHTML += html;
    return;
  }
  if (visibleInvoiceIds.has(invoice._id)) containers.invoices.innerHTML += html;
}

function renderInvoices(invoices) {
  const containers = getInvoiceListContainers();
  if (!containers.invoices || !containers.quotes || !containers.acceptedQuotes) return;

  clearInvoiceListContainers(containers);
  const filters = getInvoiceListFilters();
  const selection = selectInvoiceList(invoices, filters);
  const { quotes, acceptedQuotes, orders, visibleInvoiceIds, paidTotal, pendingTotal, electronicReadyCount, sortedInvoices } = selection;
  updateInvoiceListMetrics({ quotes, acceptedQuotes, orders, visibleInvoiceIds, paidTotal, pendingTotal, electronicReadyCount }, filters);

  sortedInvoices.forEach(invoice => appendInvoiceListRow(containers, invoice, visibleInvoiceIds));
  if (!visibleInvoiceIds.size) containers.invoices.innerHTML = '<p class="empty-state">Aucune facture ne correspond à ces critères.</p>';
}

function showOrderTab(tabId) {
  document.querySelectorAll(".order-tab").forEach(tab => tab.classList.remove("active"));
  document.getElementById(tabId)?.classList.add("active");
}
