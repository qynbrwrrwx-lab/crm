// Produits : interactions et enregistrement du formulaire.
async function addProduct() {
  const product = readProductFormData();
  if (!product.name || !product.priceHT) return showToast("Nom et prix obligatoires ❗");

  showLoader();
  try {
    await apiFetch(editingProductId ? `/api/products/${editingProductId}` : "/api/products", {
      method: editingProductId ? "PUT" : "POST",
      body: JSON.stringify(product)
    });
    clearProductForm();
    editingProductId = null;
    resetProductFormMode();
    updateProductPricePreview();
    loadProducts();
    loadInvoiceData();
    if (typeof celebrateFormCard === "function") celebrateFormCard(".product-form-card");
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
  populateProductForm(product);
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
  clearProductForm();
  resetProductFormMode();
  updateProductPricePreview();
  showToast("Modification annulée");
}

function updateProductPricePreview() {
  const priceHT = Number(document.getElementById("productPriceHT")?.value || 0);
  const tva = Number(document.getElementById("productTVA")?.value || 0);
  const name = document.getElementById("productName")?.value.trim() || "Nouveau produit";
  const reference = document.getElementById("productReference")?.value.trim() || "Sans référence";
  const category = document.getElementById("productCategory")?.value.trim() || "Non classé";
  const stock = Number(document.getElementById("productStock")?.value || 0);
  const preview = document.getElementById("productPriceTTCPreview");
  const detail = document.getElementById("productPriceTTCDetail");
  if (!preview || !detail) return;
  document.getElementById("productPreviewName").textContent = name;
  document.getElementById("productPreviewMeta").textContent = `${category} · ${reference} · ${priceHT > 0 ? `${priceHT.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT` : "prix à renseigner"}`;
  document.getElementById("productPreviewStock").textContent = `${Number.isFinite(stock) ? stock : 0} ${Number.isFinite(stock) && stock > 1 ? "unités" : "unité"}`;
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
  ["productPriceHT", "productTVA", "productName", "productReference", "productCategory", "productStock", "productLowStockThreshold"]
    .forEach(id => document.getElementById(id)?.addEventListener("input", updateProductPricePreview));
  document.getElementById("restockQuantity")?.addEventListener("input", updateRestockPreview);
  updateProductPricePreview();
});
