// Documents commerciaux : rendu et sélection des produits dans l’éditeur.
function renderInvoiceProductPicker(products) {
  document.getElementById("addProductBody").innerHTML = `
    <input id="productSearch" class="product-picker-search" type="text" placeholder="Rechercher un produit...">
    <div id="productList">
      ${products.map(product => `
        <div class="product-picker-row" onclick="addProductToInvoice('${product._id}')">
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            <div class="erp-items">${Number(product.priceHT).toFixed(2)} € HT</div>
          </div>
          <button class="primary-btn" type="button">Ajouter</button>
        </div>
      `).join("")}
    </div>
  `;
}

function addInvoiceProduct(products, productId) {
  const product = products.find(item => item._id === productId);
  if (!product) return null;
  const existing = currentInvoice.products.find(item => item.productId._id === productId);
  if (existing) {
    existing.quantity += 1;
    return existing;
  }
  const line = {
    productId: product,
    quantity: 1,
    discount: 0,
    unitHT: Number(product.priceHT),
    unitTTC: Number(product.priceHT) * (1 + Number(product.tva || 20) / 100)
  };
  currentInvoice.products.push(line);
  return line;
}
