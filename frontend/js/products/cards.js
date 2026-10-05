// Produits : rendu du catalogue.

function renderProducts(products) {
  const list = document.getElementById("productsList");
  if (!list) return;

  list.innerHTML = "";
  if (!products.length) {
    list.innerHTML = '<p class="empty-state">Aucun produit ne correspond à votre recherche.</p>';
    return;
  }

  products.forEach(product => {
    const stock = Number(product.stock || 0);
    const threshold = Number.isInteger(Number(product.lowStockThreshold)) ? Number(product.lowStockThreshold) : 5;
    const stockState = stock === 0 ? "empty" : stock <= threshold ? "low" : "healthy";
    const stockLabel = stock === 0 ? "Rupture" : stock <= threshold ? "Stock faible" : "Stock disponible";
    const priceHT = Number(product.priceHT || 0);
    const marginHT = priceHT - Number(product.purchasePriceHT || 0);
    const priceTTC = Number(product.priceTTC || priceHT * (1 + Number(product.tva || 0) / 100));

    list.innerHTML += `
      <article class="product-card product-card-${stockState}">
        <div class="product-card-topline">
          <span class="product-reference">${escapeHtml(product.category || "Non classé")} · ${escapeHtml(product.reference || "Sans référence")}</span>
          <span class="product-stock-badge">${stockLabel}</span>
        </div>
        <div class="product-card-title-row">
          <div>
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.description || "Aucune description renseignée.")}</p>
            ${product.supplierName ? `<small class="product-supplier">Fournisseur : ${escapeHtml(product.supplierName)}${product.supplierReference ? ` · ${escapeHtml(product.supplierReference)}` : ""}</small>` : ""}
          </div>
          <div class="product-card-actions">
            <button type="button" class="product-icon-action" title="Voir la fiche de ${escapeHtml(product.name)}" onclick="openRestockModal('${product._id}')">Voir la fiche</button>
            <button type="button" class="product-icon-action" title="Modifier ${escapeHtml(product.name)}" onclick="editProduct('${product._id}')">Modifier</button>
            <button type="button" class="product-icon-action delete" title="Supprimer ${escapeHtml(product.name)}" onclick="deleteProduct('${product._id}')">Supprimer</button>
          </div>
        </div>
        <div class="product-price-grid">
          <div><span>Prix HT</span><strong>${formatProductCurrency(priceHT)}</strong></div>
          <div><span>TVA</span><strong>${Number(product.tva || 0)} %</strong></div>
          <div><span>Prix TTC</span><strong>${formatProductCurrency(priceTTC)}</strong></div>
          <div><span>Marge HT</span><strong>${formatProductCurrency(marginHT)}</strong></div>
        </div>
        <div class="product-stock-panel">
          <div class="product-stock-line"><span>Stock disponible <small>· alerte à ${threshold}</small></span><strong>${stock} <small>unités</small></strong></div>
          <div class="product-stock-meter"><span style="width:${stock === 0 ? 0 : stock <= threshold ? 35 : 100}%"></span></div>
          <button type="button" class="stock-restock-trigger" onclick="openRestockModal('${product._id}')">Gérer le stock et l'historique</button>
        </div>
      </article>`;
  });
}
