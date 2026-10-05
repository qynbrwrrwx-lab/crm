// Produits : replenishment. Voir README.md.

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
  const urgent = allProducts.filter(product => Number(product.stock || 0) <= Number(product.lowStockThreshold ?? 5));
  if (!urgent.length) {
    showToast("Aucun réassort n’est nécessaire selon les seuils définis.");
    return;
  }
  const rows = [["Produit", "Référence", "Fournisseur", "Référence fournisseur", "Stock actuel", "Seuil d’alerte", "Quantité conseillée"], ...urgent
    .sort((left, right) => Number(left.stock || 0) - Number(right.stock || 0))
    .map(product => {
      const stock = Number(product.stock || 0), threshold = Number(product.lowStockThreshold ?? 5);
      return [product.name || "", product.reference || "", product.supplierName || "À renseigner", product.supplierReference || "", stock, threshold, Math.max(1, threshold * 2 - stock)];
    })];
  downloadCsvFile(rows, "reassort-a-commander");
  showToast(`${urgent.length} produit${urgent.length > 1 ? "s" : ""} ajouté${urgent.length > 1 ? "s" : ""} à la liste de réassort.`);
}

function prepareRestockOrders() {
  const urgent = allProducts.filter(product => Number(product.stock || 0) <= Number(product.lowStockThreshold ?? 5));
  if (!urgent.length) return showToast("Aucun réassort n’est nécessaire selon les seuils définis.");
  const groups = urgent.reduce((result, product) => {
    const supplier = product.supplierName || "Fournisseur à renseigner";
    (result[supplier] ||= []).push(product);
    return result;
  }, {});
  const escape = value => String(value || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const sections = Object.entries(groups).sort(([left], [right]) => left.localeCompare(right, "fr-FR")).map(([supplier, products], index) => `<section class="order"><header><div><small>MY PROSPECT · RÉASSORT</small><h1>Bon de commande fournisseur</h1><p>Document préparatoire · ${new Date().toLocaleDateString("fr-FR")}</p></div><strong>BC-R${String(index + 1).padStart(3, "0")}</strong></header><h2>${escape(supplier)}</h2><table><thead><tr><th>Produit</th><th>Référence</th><th>Réf. fournisseur</th><th>Stock</th><th>À commander</th></tr></thead><tbody>${products.sort((left, right) => Number(left.stock || 0) - Number(right.stock || 0)).map(product => { const stock = Number(product.stock || 0), threshold = Number(product.lowStockThreshold ?? 5); return `<tr><td>${escape(product.name)}</td><td>${escape(product.reference || "—")}</td><td>${escape(product.supplierReference || "—")}</td><td>${stock}</td><td><b>${Math.max(1, threshold * 2 - stock)}</b></td></tr>`; }).join("")}</tbody></table><footer>Quantités suggérées pour revenir à deux fois le seuil d’alerte. Les tarifs ne sont volontairement pas affichés.</footer></section>`).join("");
  const page = window.open("", "_blank", "noopener,noreferrer");
  if (!page) return showToast("Autorisez les fenêtres contextuelles pour préparer les commandes.");
  page.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Bons de commande · My Prospect</title><style>body{font-family:Arial,sans-serif;color:#172033;margin:32px}.order{page-break-after:always;margin-bottom:48px}header{display:flex;justify-content:space-between;border-bottom:2px solid #2563eb;padding-bottom:18px}small{color:#2563eb;font-weight:bold;letter-spacing:.08em}h1{margin:8px 0;font-size:24px}h2{margin:26px 0 14px}p,footer{color:#64748b;font-size:13px}header strong{color:#2563eb}table{width:100%;border-collapse:collapse}th,td{padding:11px;border-bottom:1px solid #dbe3ef;text-align:left}th{background:#eff6ff;color:#1e3a8a;font-size:12px;text-transform:uppercase}td:last-child,th:last-child{text-align:right}@media print{body{margin:16px}.order{break-after:page}}</style></head><body>${sections}<script>window.onload=()=>window.print();<\/script></body></html>`);
  page.document.close();
}
