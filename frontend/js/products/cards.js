// Produits : rendu du catalogue.

function getProductCardPresentation(product) {
  const stock = Number(product.stock || 0);
  const threshold = Number.isInteger(Number(product.lowStockThreshold)) ? Number(product.lowStockThreshold) : 5;
  const stockState = stock === 0 ? "empty" : stock <= threshold ? "low" : "healthy";
  const priceHT = Number(product.priceHT || 0);
  const priceTTC = Number(product.priceTTC || priceHT * (1 + Number(product.tva || 0) / 100));
  return {
    id: product._id,
    stockState,
    stockLabel: stock === 0 ? "Rupture" : stock <= threshold ? "Stock faible" : "Stock disponible",
    category: product.category || "Non classé",
    reference: product.reference || "Sans référence",
    name: product.name,
    description: product.description || "Aucune description renseignée.",
    supplierName: product.supplierName || "",
    supplierReference: product.supplierReference || "",
    priceHTLabel: formatProductCurrency(priceHT),
    tvaLabel: `${Number(product.tva || 0)} %`,
    priceTTCLabel: formatProductCurrency(priceTTC),
    marginHTLabel: formatProductCurrency(priceHT - Number(product.purchasePriceHT || 0)),
    stock,
    threshold,
    stockMeterWidth: stock === 0 ? 0 : stock <= threshold ? 35 : 100
  };
}

function renderProducts(products) {
  const list = document.getElementById("productsList");
  if (!list) return;

  list.innerHTML = "";
  if (!products.length) {
    list.innerHTML = '<p class="empty-state">Aucun produit ne correspond à votre recherche.</p>';
    return;
  }

  products.forEach(product => {
    const item = getProductCardPresentation(product);

    list.innerHTML += `
      <article class="product-card product-card-${item.stockState}">
        <div class="product-card-topline">
          <span class="product-reference">${escapeHtml(item.category)} · ${escapeHtml(item.reference)}</span>
          <span class="product-stock-badge">${item.stockLabel}</span>
        </div>
        <div class="product-card-title-row">
          <div>
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.description)}</p>
            ${item.supplierName ? `<small class="product-supplier">Fournisseur : ${escapeHtml(item.supplierName)}${item.supplierReference ? ` · ${escapeHtml(item.supplierReference)}` : ""}</small>` : ""}
          </div>
          <div class="product-card-actions">
            <button type="button" class="product-icon-action" title="Voir la fiche de ${escapeHtml(item.name)}" onclick="openRestockModal('${item.id}')">Voir la fiche</button>
            <button type="button" class="product-icon-action" title="Modifier ${escapeHtml(item.name)}" onclick="editProduct('${item.id}')">Modifier</button>
            <button type="button" class="product-icon-action delete" title="Supprimer ${escapeHtml(item.name)}" onclick="deleteProduct('${item.id}')">Supprimer</button>
          </div>
        </div>
        <div class="product-price-grid">
          <div><span>Prix HT</span><strong>${item.priceHTLabel}</strong></div>
          <div><span>TVA</span><strong>${item.tvaLabel}</strong></div>
          <div><span>Prix TTC</span><strong>${item.priceTTCLabel}</strong></div>
          <div><span>Marge HT</span><strong>${item.marginHTLabel}</strong></div>
        </div>
        <div class="product-stock-panel">
          <div class="product-stock-line"><span>Stock disponible <small>· alerte à ${item.threshold}</small></span><strong>${item.stock} <small>unités</small></strong></div>
          <div class="product-stock-meter"><span style="width:${item.stockMeterWidth}%"></span></div>
          <button type="button" class="stock-restock-trigger" onclick="openRestockModal('${item.id}')">Gérer le stock et l'historique</button>
        </div>
      </article>`;
  });
}
