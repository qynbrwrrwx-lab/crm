// Produits : replenishment. Voir README.md.

const restockSuggestionHeaders = ["Produit", "Référence", "Fournisseur", "Référence fournisseur", "Stock actuel", "Seuil d’alerte", "Quantité conseillée"];

function getRestockThreshold(product) {
  return Number(product.lowStockThreshold ?? 5);
}

function getSuggestedRestockQuantity(product) {
  return Math.max(1, getRestockThreshold(product) * 2 - Number(product.stock || 0));
}

function getUrgentRestockProducts(products) {
  return products
    .filter(product => Number(product.stock || 0) <= getRestockThreshold(product))
    .sort((left, right) => Number(left.stock || 0) - Number(right.stock || 0));
}

function getRestockSuggestionRows(products) {
  return [restockSuggestionHeaders, ...getUrgentRestockProducts(products).map(product => [
    product.name || "",
    product.reference || "",
    product.supplierName || "À renseigner",
    product.supplierReference || "",
    Number(product.stock || 0),
    getRestockThreshold(product),
    getSuggestedRestockQuantity(product)
  ])];
}

function groupRestockProductsBySupplier(products) {
  const groups = getUrgentRestockProducts(products).reduce((result, product) => {
    const supplier = product.supplierName || "Fournisseur à renseigner";
    (result[supplier] ||= []).push(product);
    return result;
  }, {});
  return Object.entries(groups).sort(([left], [right]) => left.localeCompare(right, "fr-FR"));
}

function escapeRestockText(value) {
  return String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function getRestockOrderPresentation(products, dateLabel) {
  return groupRestockProductsBySupplier(products).map(([supplier, supplierProducts], index) => ({
    number: `BC-R${String(index + 1).padStart(3, "0")}`,
    supplier: escapeRestockText(supplier),
    dateLabel,
    products: supplierProducts.map(product => ({
      name: escapeRestockText(product.name),
      reference: escapeRestockText(product.reference || "—"),
      supplierReference: escapeRestockText(product.supplierReference || "—"),
      stock: Number(product.stock || 0),
      suggestedQuantity: getSuggestedRestockQuantity(product)
    }))
  }));
}

function renderRestockOrderSections(orders) {
  return orders.map(order => `<section class="order"><header><div><small>MY PROSPECT · RÉASSORT</small><h1>Bon de commande fournisseur</h1><p>Document préparatoire · ${order.dateLabel}</p></div><strong>${order.number}</strong></header><h2>${order.supplier}</h2><table><thead><tr><th>Produit</th><th>Référence</th><th>Réf. fournisseur</th><th>Stock</th><th>À commander</th></tr></thead><tbody>${order.products.map(product => `<tr><td>${product.name}</td><td>${product.reference}</td><td>${product.supplierReference}</td><td>${product.stock}</td><td><b>${product.suggestedQuantity}</b></td></tr>`).join("")}</tbody></table><footer>Quantités suggérées pour revenir à deux fois le seuil d’alerte. Les tarifs ne sont volontairement pas affichés.</footer></section>`).join("");
}

function ensureRestockExportAction() {
  const heading = document.getElementById("productsFilter")?.closest(".list-toolbar-card")?.querySelector(".list-toolbar-heading");
  if (!heading || document.getElementById("exportRestockSuggestionsButton")) return;
  const csvButton = document.createElement("button");
  csvButton.id = "exportRestockSuggestionsButton";
  csvButton.type = "button";
  csvButton.className = "secondary-btn compact-export-btn";
  csvButton.textContent = "Réassort à commander";
  csvButton.onclick = exportRestockSuggestionsCsv;
  const orderButton = document.createElement("button");
  orderButton.type = "button";
  orderButton.className = "secondary-btn compact-export-btn";
  orderButton.textContent = "Préparer les commandes";
  orderButton.onclick = prepareRestockOrders;
  heading.append(csvButton, orderButton);
}

function exportRestockSuggestionsCsv() {
  const urgent = getUrgentRestockProducts(allProducts);
  if (!urgent.length) {
    showToast("Aucun réassort n’est nécessaire selon les seuils définis.");
    return;
  }
  downloadCsvFile(getRestockSuggestionRows(allProducts), "reassort-a-commander");
  showToast(`${urgent.length} produit${urgent.length > 1 ? "s" : ""} ajouté${urgent.length > 1 ? "s" : ""} à la liste de réassort.`);
}

function prepareRestockOrders() {
  const urgent = getUrgentRestockProducts(allProducts);
  if (!urgent.length) return showToast("Aucun réassort n’est nécessaire selon les seuils définis.");
  const orders = getRestockOrderPresentation(allProducts, new Date().toLocaleDateString("fr-FR"));
  const sections = renderRestockOrderSections(orders);
  const page = window.open("", "_blank", "noopener,noreferrer");
  if (!page) return showToast("Autorisez les fenêtres contextuelles pour préparer les commandes.");
  page.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Bons de commande · My Prospect</title><style>body{font-family:Arial,sans-serif;color:#172033;margin:32px}.order{page-break-after:always;margin-bottom:48px}header{display:flex;justify-content:space-between;border-bottom:2px solid #2563eb;padding-bottom:18px}small{color:#2563eb;font-weight:bold;letter-spacing:.08em}h1{margin:8px 0;font-size:24px}h2{margin:26px 0 14px}p,footer{color:#64748b;font-size:13px}header strong{color:#2563eb}table{width:100%;border-collapse:collapse}th,td{padding:11px;border-bottom:1px solid #dbe3ef;text-align:left}th{background:#eff6ff;color:#1e3a8a;font-size:12px;text-transform:uppercase}td:last-child,th:last-child{text-align:right}@media print{body{margin:16px}.order{break-after:page}}</style></head><body>${sections}<script>window.onload=()=>window.print();<\/script></body></html>`);
  page.document.close();
}
