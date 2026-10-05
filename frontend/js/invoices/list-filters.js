// Documents commerciaux : état des filtres de liste.

function getInvoiceListFilters() {
  return {
    search: document.getElementById("invoiceSearch")?.value.trim().toLocaleLowerCase("fr-FR") || "",
    status: document.getElementById("invoiceStatusFilter")?.value || "all",
    electronicStatus: document.getElementById("electronicInvoiceStatusFilter")?.value || "all",
    sort: document.getElementById("invoiceSort")?.value || "recent"
  };
}

function resetInvoiceListFilterFields() {
  const search = document.getElementById("invoiceSearch");
  const filter = document.getElementById("invoiceStatusFilter");
  const electronicFilter = document.getElementById("electronicInvoiceStatusFilter");
  const sort = document.getElementById("invoiceSort");
  if (search) search.value = "";
  if (filter) filter.value = "all";
  if (electronicFilter) electronicFilter.value = "all";
  if (sort) sort.value = "recent";
  return search;
}
