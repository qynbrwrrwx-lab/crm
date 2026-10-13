// Produits : catalog. Voir README.md.

async function loadProducts() {

  if (!document.getElementById("productPurchasePriceHT")) document.getElementById("productPriceHT")?.closest("label")?.insertAdjacentHTML("afterend",'<label class="form-field"><span>Prix d’achat HT</span><input id="productPurchasePriceHT" type="number" min="0" step="0.01" placeholder="0,00" /></label>');

  const products =
  await apiFetch("/api/products");

  allProducts = products;
  renderSuppliers?.();
  populateProductCategories(products);
  ensureRestockExportAction();
  filterProducts();
  updateStockKPI(products);
}

function ensureProductPrioritySort() {
  const select = document.getElementById("productSort");
  if (select && !select.querySelector('option[value="restock-priority"]')) {
    select.insertAdjacentHTML("beforeend", '<option value="restock-priority">Réassort prioritaire</option>');
  }
}

function filterProducts() {
  ensureProductPrioritySort();
  const query = document.getElementById("productsFilter")?.value
    .trim()
    .toLocaleLowerCase("fr-FR") || "";

  const stockFilter = document.getElementById("productStockFilter")?.value || "all";
  const categoryFilter = document.getElementById("productCategoryFilter")?.value || "all";
  const sort = document.getElementById("productSort")?.value || "recent";
  const filteredCount = document.getElementById("productFilteredCount");
  const resetButton = document.getElementById("resetProductFilters");

  const filteredProducts = selectProducts(allProducts, { query, stockFilter, categoryFilter, sort });

  if (filteredCount) filteredCount.textContent = `${filteredProducts.length} produit${filteredProducts.length > 1 ? "s" : ""} affiché${filteredProducts.length > 1 ? "s" : ""}`;
  if (resetButton) resetButton.hidden = !(query || stockFilter !== "all" || categoryFilter !== "all" || sort !== "recent");
  renderProducts(filteredProducts);
}

function resetProductFilters() {
  const search = document.getElementById("productsFilter");
  const stock = document.getElementById("productStockFilter");
  const category = document.getElementById("productCategoryFilter");
  const sort = document.getElementById("productSort");
  if (search) search.value = "";
  if (stock) stock.value = "all";
  if (category) category.value = "all";
  if (sort) sort.value = "recent";
  filterProducts();
  search?.focus();
}

function populateProductCategories(products) {
  const categories = getProductCategories(products);
  const datalist = document.getElementById("productCategories");
  const filter = document.getElementById("productCategoryFilter");
  const selected = filter?.value || "all";

  if (datalist) {
    datalist.innerHTML = categories.map(category => `<option value="${escapeHtml(category)}"></option>`).join("");
  }
  if (filter) {
    filter.innerHTML = '<option value="all">Toutes les catégories</option>' +
      categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
    filter.value = categories.includes(selected) ? selected : "all";
  }
}

function getProductDeletionPresentation() {
  return {
    confirmation: {
      title: "Supprimer ce produit ?",
      message: "Cette suppression est définitive. Les produits présents dans des documents restent protégés.",
      actionLabel: "Supprimer le produit",
      danger: true
    },
    successMessage: "Produit supprimé 🗑️"
  };
}

async function deleteProduct(id) {
  const presentation = getProductDeletionPresentation();
  if (!await confirmAppAction(presentation.confirmation)) return;

  try {
    await apiFetch(`/api/products/${id}`, { method: "DELETE" });
    await loadProducts();
    await loadInvoiceData();
    showToast(presentation.successMessage);
  } catch (err) {
    showToast(err.message || "Impossible de supprimer ce produit");
  }
}
