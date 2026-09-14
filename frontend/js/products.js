let editingProductId = null;
let allProducts = [];
let restockingProductId = null;

// ================= LOAD PRODUCTS =================

async function loadProducts() {

  const products =
  await apiFetch("/api/products");

  allProducts = products;
  renderProducts(products);
  updateStockKPI(products);
}

// ================= RENDER PRODUCTS =================

function renderProducts(products) {

  const list =
    document.getElementById("productsList");

  if (!list) return;

  list.innerHTML = "";

  if (!products.length) {
    list.innerHTML = '<p class="empty-state">Aucun produit ne correspond à votre recherche.</p>';
    return;
  }

  products.forEach(product => {
    const stock = Number(product.stock || 0);
    const stockState = stock === 0 ? "empty" : stock <= 5 ? "low" : "healthy";
    const stockLabel = stock === 0 ? "Rupture" : stock <= 5 ? "Stock faible" : "Stock disponible";
    const priceHT = Number(product.priceHT || 0);
    const priceTTC = Number(product.priceTTC || priceHT * (1 + Number(product.tva || 0) / 100));

    list.innerHTML += `

      <article class="product-card product-card-${stockState}">
        <div class="product-card-topline">
          <span class="product-reference">${escapeHtml(product.reference || "Sans référence")}</span>
          <span class="product-stock-badge">${stockLabel}</span>
        </div>

        <div class="product-card-title-row">
          <div>
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.description || "Aucune description renseignée.")}</p>
          </div>
          <div class="product-card-actions">
            <button type="button" class="product-icon-action" title="Modifier ${escapeHtml(product.name)}" onclick="editProduct('${product._id}')">Modifier</button>
            <button type="button" class="product-icon-action delete" title="Supprimer ${escapeHtml(product.name)}" onclick="deleteProduct('${product._id}')">Supprimer</button>
          </div>
        </div>

        <div class="product-price-grid">
          <div><span>Prix HT</span><strong>${priceHT.toFixed(2)} €</strong></div>
          <div><span>TVA</span><strong>${Number(product.tva || 0)} %</strong></div>
          <div><span>Prix TTC</span><strong>${priceTTC.toFixed(2)} €</strong></div>
        </div>

        <div class="product-stock-panel">
          <div class="product-stock-line"><span>Stock disponible</span><strong>${stock} <small>unités</small></strong></div>
          <div class="product-stock-meter"><span style="width:${stock === 0 ? 0 : stock <= 5 ? 35 : 100}%"></span></div>
          <button type="button" class="stock-restock-trigger" onclick="openRestockModal('${product._id}')">Gérer le stock et l'historique</button>
        </div>
      </article>
    `;
  });
}

function filterProducts() {
  const query = document.getElementById("productsFilter")?.value
    .trim()
    .toLocaleLowerCase("fr-FR") || "";

  const stockFilter = document.getElementById("productStockFilter")?.value || "all";

  const filteredProducts = allProducts.filter(product =>
    [product.name, product.reference, product.description]
      .filter(Boolean)
      .some(value => String(value).toLocaleLowerCase("fr-FR").includes(query)) &&
    (stockFilter === "all" ||
      (stockFilter === "low" && Number(product.stock) <= 5) ||
      (stockFilter === "available" && Number(product.stock) > 5))
  );

  renderProducts(filteredProducts);
}

async function getStockHistoryMarkup(id) {
  try {
    const movements = await apiFetch(`/api/products/${id}/movements`);

    return movements.length
      ? movements.map(movement => {
          const quantity = Number(movement.quantity);
          const sign = quantity > 0 ? "+" : "";
          const label = movement.type === "restock" ? "Réassort" : "Vente";
          const documentNumber = movement.documentId?.invoiceNumber
            ? ` · ${movement.documentId.invoiceNumber}`
            : "";

          return `<div class="stock-history-row ${quantity > 0 ? "in" : "out"}">
            <span>${escapeHtml(label)}${escapeHtml(documentNumber)}</span>
            <strong>${sign}${quantity}</strong>
            <small>${new Date(movement.createdAt).toLocaleDateString("fr-FR")}</small>
          </div>`;
        }).join("")
      : '<p class="empty-state">Aucun mouvement de stock pour le moment.</p>';
  } catch (err) {
    console.error(err);
    return `<p class="empty-state">${escapeHtml(err.message || "Historique indisponible")}</p>`;
  }
}

// ================= RESTOCK =================

async function openRestockModal(id) {
  const product = allProducts.find(item => item._id === id);
  const modal = document.getElementById("restockModal");
  if (!product || !modal) return;

  restockingProductId = id;
  document.getElementById("restockProductReference").textContent = product.reference || "Sans référence";
  document.getElementById("restockProductName").textContent = product.name;
  document.getElementById("restockCurrentStock").textContent = Number(product.stock || 0);
  document.getElementById("restockQuantity").value = "";
  document.getElementById("restockResult").textContent = "Saisissez une quantité pour calculer le nouveau stock.";
  document.getElementById("restockHistory").innerHTML = '<p class="empty-state">Chargement de l’historique…</p>';
  modal.style.display = "flex";

  document.getElementById("restockHistory").innerHTML = await getStockHistoryMarkup(id);
  document.getElementById("restockQuantity").focus();
}

function closeRestockModal() {
  document.getElementById("restockModal").style.display = "none";
  restockingProductId = null;
}

function updateRestockPreview() {
  const product = allProducts.find(item => item._id === restockingProductId);
  const quantity = Number(document.getElementById("restockQuantity")?.value || 0);
  const result = document.getElementById("restockResult");
  if (!product || !result) return;

  if (!Number.isInteger(quantity) || quantity <= 0) {
    result.textContent = "Saisissez une quantité entière positive.";
    return;
  }

  result.innerHTML = `Nouveau stock prévu : <strong>${Number(product.stock || 0) + quantity} unités</strong>`;
}

function setRestockQuantity(quantity) {
  const input = document.getElementById("restockQuantity");
  if (!input) return;
  input.value = quantity;
  updateRestockPreview();
}

async function confirmRestock() {
  const id = restockingProductId;
  if (!id) return;

  const quantity = Number(document.getElementById("restockQuantity")?.value);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    showToast("Saisissez une quantité entière positive");
    return;
  }

  try {
    await apiFetch(`/api/products/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ quantity })
    });

    await loadProducts();
    await loadInvoiceData();
    closeRestockModal();
    showToast("Stock mis à jour ✅");

  } catch (err) {
    console.error(err);
    showToast(err.message || "Erreur de mise à jour du stock");
  }
}

// ================= ADD PRODUCTS =================

async function addProduct() {

  const name =
    document.getElementById("productName").value;

  const reference =
    document.getElementById("productReference").value;

  const description =
    document.getElementById("productDescription").value;

  const priceHT =
    document.getElementById("productPriceHT").value;

  const tva =
    document.getElementById("productTVA").value;

  const stock =
    document.getElementById("productStock").value;

  if (!name || !priceHT) {

    return showToast(
      "Nom et prix obligatoires ❗"
    );
  }

  showLoader();

  try {

await apiFetch(editingProductId ? `/api/products/${editingProductId}` : "/api/products", {

      method: editingProductId ? "PUT" : "POST",

      body: JSON.stringify({

        name,
        reference,
        description,
        priceHT,
        tva,
        stock
      })
    });

    document.getElementById("productName").value = "";

    document.getElementById("productReference").value = "";

    document.getElementById("productDescription").value = "";

    document.getElementById("productPriceHT").value = "";

    document.getElementById("productTVA").value = "20";

    document.getElementById("productStock").value = "";

    editingProductId = null;
    resetProductFormMode();
    updateProductPricePreview();

    loadProducts();

    loadInvoiceData();

    showToast("Produit enregistré ✅");

  } catch (err) {

    showToast(err.message);
  }

  hideLoader();
}

function editProduct(id) {
  const product = allProducts.find(item => item._id === id);
  if (!product) return;

  editingProductId = id;
  document.getElementById("productFormTitle").textContent = "Modifier le produit";
  document.getElementById("productSubmitButton").textContent = "Enregistrer les modifications";
  document.getElementById("cancelProductEditButton").hidden = false;
  document.getElementById("productName").value = product.name || "";
  document.getElementById("productReference").value = product.reference || "";
  document.getElementById("productDescription").value = product.description || "";
  document.getElementById("productPriceHT").value = product.priceHT ?? "";
  document.getElementById("productTVA").value = product.tva ?? 20;
  document.getElementById("productStock").value = product.stock ?? 0;
  document.getElementById("productStock").disabled = true;
  updateProductPricePreview();
  showToast("Pour modifier le stock, utilisez « Ajouter du stock » dans la liste");
}

function resetProductFormMode() {
  document.getElementById("productFormTitle").textContent = "Ajouter un produit";
  document.getElementById("productSubmitButton").textContent = "Créer le produit";
  document.getElementById("cancelProductEditButton").hidden = true;
  document.getElementById("productStock").disabled = false;
}

function cancelProductEdit() {
  editingProductId = null;
  ["productName", "productReference", "productDescription", "productPriceHT", "productStock"]
    .forEach(id => { document.getElementById(id).value = ""; });
  document.getElementById("productTVA").value = "20";
  resetProductFormMode();
  updateProductPricePreview();
  showToast("Modification annulée");
}

// ================= EXPERIENCE FORMULAIRE PRODUIT =================

function updateProductPricePreview() {
  const priceHT = Number(document.getElementById("productPriceHT")?.value || 0);
  const tva = Number(document.getElementById("productTVA")?.value || 0);
  const preview = document.getElementById("productPriceTTCPreview");
  const detail = document.getElementById("productPriceTTCDetail");
  if (!preview || !detail) return;

  if (!Number.isFinite(priceHT) || priceHT <= 0 || !Number.isFinite(tva) || tva < 0) {
    preview.textContent = "0,00 €";
    detail.textContent = "Renseignez le prix HT et la TVA";
    return;
  }

  const priceTTC = priceHT * (1 + tva / 100);
  preview.textContent = `${priceTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  detail.textContent = `${priceHT.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT + ${tva} % de TVA`;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("productPriceHT")?.addEventListener("input", updateProductPricePreview);
  document.getElementById("productTVA")?.addEventListener("input", updateProductPricePreview);
  document.getElementById("restockQuantity")?.addEventListener("input", updateRestockPreview);
  updateProductPricePreview();
});

// ================= DELETE PRODUCTS =================

async function deleteProduct(id) {
  if (!window.confirm("Supprimer définitivement ce produit ?")) return;

  try {
    await apiFetch(`/api/products/${id}`, { method: "DELETE" });
    await loadProducts();
    await loadInvoiceData();
    showToast("Produit supprimé 🗑️");
  } catch (err) {
    showToast(err.message || "Impossible de supprimer ce produit");
  }
}
