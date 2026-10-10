// Produits : stock. Voir README.md.

function renderStockHistory(movements) {
  if (!movements.length) return '<p class="empty-state">Aucun mouvement de stock pour le moment.</p>';
  return movements.map(movement => {
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
  }).join("");
}

async function getStockHistoryMarkup(id) {
  try {
    return renderStockHistory(await apiFetch(`/api/products/${id}/movements`));
  } catch (err) {
    console.error(err);
    return `<p class="empty-state">${escapeHtml(err.message || "Historique indisponible")}</p>`;
  }
}

function initializeRestockModal(product) {
  document.getElementById("restockProductReference").textContent = product.reference || "Sans référence";
  document.getElementById("restockProductName").textContent = product.name;
  document.getElementById("restockCurrentStock").textContent = Number(product.stock || 0);
  document.getElementById("restockQuantity").value = "";
  document.getElementById("restockResult").textContent = "Saisissez une quantité pour calculer le nouveau stock.";
  document.getElementById("restockHistory").innerHTML = '<p class="empty-state">Chargement de l’historique…</p>';
  document.getElementById("productSoldQuantity").textContent = "…";
  document.getElementById("productRevenue").textContent = "…";
  document.getElementById("productLastDocument").textContent = "Chargement…";
  document.getElementById("productLastDocumentDate").textContent = "Analyse de l’activité commerciale";
  document.getElementById("productDocumentCount").textContent = "…";
  document.getElementById("productDocumentHistory").innerHTML = '<p class="empty-state">Chargement des documents…</p>';
}

async function openRestockModal(id) {
  const product = allProducts.find(item => item._id === id);
  const modal = document.getElementById("restockModal");
  if (!product || !modal) return;

  restockingProductId = id;
  initializeRestockModal(product);
  modal.style.display = "flex";

  const [historyMarkup, commercialSummary] = await Promise.all([
    getStockHistoryMarkup(id),
    getProductCommercialSummary(id)
  ]);

  if (restockingProductId !== id) return;
  document.getElementById("restockHistory").innerHTML = historyMarkup;
  renderProductCommercialSummary(commercialSummary);
  document.getElementById("restockQuantity").focus();
}

function closeRestockModal() {
  document.getElementById("restockModal").style.display = "none";
  restockingProductId = null;
}

function updateRestockPreview() {
  const product = allProducts.find(item => item._id === restockingProductId);
  const result = document.getElementById("restockResult");
  if (!product || !result) return;
  const projection = getRestockProjection(product, document.getElementById("restockQuantity")?.value);

  if (!projection.valid) {
    result.textContent = projection.message;
    return;
  }

  result.innerHTML = `Nouveau stock prévu : <strong>${projection.nextStock} unités</strong>`;
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

  const projection = getRestockProjection({ stock: 0 }, document.getElementById("restockQuantity")?.value);

  if (!projection?.valid) {
    showToast("Saisissez une quantité entière positive");
    return;
  }

  try {
    await apiFetch(`/api/products/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ quantity: projection.quantity })
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
