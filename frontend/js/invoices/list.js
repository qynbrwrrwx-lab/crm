// Documents commerciaux : list. Voir README.md pour les responsabilités.

async function loadInvoices() {

  try {

    const invoices =
  await apiFetch("/api/invoices");

    allInvoices = invoices;
    renderTreasury?.();
    renderInvoices(invoices);
    updateBusinessKPI(invoices);

  } catch (err) {

    console.error(err);

    showToast(err.message);
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

function renderInvoices(invoices) {

  const invoiceList =
    document.getElementById("invoiceList");

  const quotesList =
    document.getElementById("quotesContainer");

  const acceptedQuotesList =
    document.getElementById("acceptedQuotesContainer");

  const ordersContainer =
    document.getElementById("ordersContainer");


  // Vérifier que les conteneurs principaux existent

  if (
    !invoiceList ||
    !quotesList ||
    !acceptedQuotesList
  ) {
    return;
  }


  // Vider les listes

  invoiceList.innerHTML = "";

  quotesList.innerHTML = "";

  acceptedQuotesList.innerHTML = "";

  if (ordersContainer) {
    ordersContainer.innerHTML = "";
  }


  const { search, status, electronicStatus, sort } = getInvoiceListFilters();

  const { quotes, acceptedQuotes, orders, visibleInvoiceIds, paidTotal, pendingTotal, electronicReadyCount, sortedInvoices } = selectInvoiceList(invoices, { search, status, electronicStatus, sort });
  updateInvoiceListMetrics({ quotes, acceptedQuotes, orders, visibleInvoiceIds, paidTotal, pendingTotal, electronicReadyCount }, { search, status, electronicStatus, sort });


  // ================= AFFICHAGE =================

  sortedInvoices.forEach(invoice => {
    const html = renderInvoiceListRow(invoice);

    // ================= DEVIS =================

    if (invoice.type === "quote") {

      if (invoice.status === "accepted") {

        acceptedQuotesList.innerHTML += html;

      } else {

        quotesList.innerHTML += html;

      }

    }


    // ================= COMMANDES =================

    else if (invoice.type === "order") {

      if (ordersContainer) {

        ordersContainer.innerHTML += html;

      }

    }


    // ================= FACTURES =================

    else if (visibleInvoiceIds.has(invoice._id)) {

      invoiceList.innerHTML += html;

    }

  });

  if (!visibleInvoiceIds.size) {
    invoiceList.innerHTML = '<p class="empty-state">Aucune facture ne correspond à ces critères.</p>';
  }

}

function showOrderTab(tabId) {

  document
    .querySelectorAll(".order-tab")
    .forEach(tab => {

      tab.classList.remove("active");

    });

  document
    .getElementById(tabId)
    ?.classList.add("active");
}
