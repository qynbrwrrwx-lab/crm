let editingProductId = null;
let allProducts = [];

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

    list.innerHTML += `

      <div class="client">

        <div class="client-info">

          <strong>
            ${escapeHtml(product.name)}
          </strong>

          <br>

          Réf :
          ${escapeHtml(product.reference || "-")}

          <br>

          HT :
          ${Number(product.priceHT).toFixed(2)} €

          <br>

          TVA :
          ${product.tva} %

          <br>

          TTC :
          ${Number(product.priceTTC).toFixed(2)} €

          <br>

          Stock :
          <strong class="${Number(product.stock) <= 5 ? "stock-low" : ""}">${product.stock}</strong>
          ${Number(product.stock) <= 5 ? '<span class="stock-alert">Stock faible</span>' : ""}

          <div class="stock-adjustment">
            <input
              id="stockAdjustment-${product._id}"
              type="number"
              min="1"
              step="1"
              placeholder="Quantité"
            />
            <button
              type="button"
              class="secondary-btn"
              onclick="restockProduct('${product._id}')"
            >
              Ajouter du stock
            </button>
          </div>

          <button
            type="button"
            class="stock-history-toggle"
            onclick="showStockHistory('${product._id}')"
          >
            Voir l'historique du stock
          </button>

          <div id="stockHistory-${product._id}" class="stock-history"></div>

        </div>

        <div>

          <button onclick="editProduct('${product._id}')">Modifier</button>

          <button
            class="delete"
            onclick="deleteProduct('${product._id}')"
          >
            ❌
          </button>

        </div>

      </div>
    `;
  });
}

function filterProducts() {
  const query = document.getElementById("productsFilter")?.value
    .trim()
    .toLocaleLowerCase("fr-FR") || "";

  const filteredProducts = allProducts.filter(product =>
    [product.name, product.reference, product.description]
      .filter(Boolean)
      .some(value => String(value).toLocaleLowerCase("fr-FR").includes(query))
  );

  renderProducts(filteredProducts);
}

async function showStockHistory(id) {
  const container = document.getElementById(`stockHistory-${id}`);
  if (!container) return;

  if (container.dataset.loaded === "true") {
    container.classList.toggle("visible");
    return;
  }

  try {
    const movements = await apiFetch(`/api/products/${id}/movements`);

    container.innerHTML = movements.length
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
      : "<p>Aucun mouvement de stock.</p>";

    container.dataset.loaded = "true";
    container.classList.add("visible");
  } catch (err) {
    console.error(err);
    showToast(err.message || "Impossible d'afficher l'historique");
  }
}

// ================= RESTOCK =================

async function restockProduct(id) {

  const input = document.getElementById(`stockAdjustment-${id}`);
  const quantity = Number(input?.value);

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
  document.getElementById("productFormTitle").textContent = "📦 Modifier le produit";
  document.getElementById("productSubmitButton").textContent = "Enregistrer les modifications";
  document.getElementById("cancelProductEditButton").hidden = false;
  document.getElementById("productName").value = product.name || "";
  document.getElementById("productReference").value = product.reference || "";
  document.getElementById("productDescription").value = product.description || "";
  document.getElementById("productPriceHT").value = product.priceHT ?? "";
  document.getElementById("productTVA").value = product.tva ?? 20;
  document.getElementById("productStock").value = product.stock ?? 0;
  document.getElementById("productStock").disabled = true;
  showToast("Pour modifier le stock, utilisez « Ajouter du stock » dans la liste");
}

function resetProductFormMode() {
  document.getElementById("productFormTitle").textContent = "📦 Ajouter produit";
  document.getElementById("productSubmitButton").textContent = "Ajouter produit";
  document.getElementById("cancelProductEditButton").hidden = true;
  document.getElementById("productStock").disabled = false;
}

function cancelProductEdit() {
  editingProductId = null;
  ["productName", "productReference", "productDescription", "productPriceHT", "productStock"]
    .forEach(id => { document.getElementById(id).value = ""; });
  document.getElementById("productTVA").value = "20";
  resetProductFormMode();
  showToast("Modification annulée");
}

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
