// ================= LOAD PRODUCTS =================

async function loadProducts() {

  const products =
  await apiFetch("/api/products");

  renderProducts(products);
}

// ================= RENDER PRODUCTS =================

function renderProducts(products) {

  const list =
    document.getElementById("productsList");

  if (!list) return;

  list.innerHTML = "";

  products.forEach(product => {

    list.innerHTML += `

      <div class="client">

        <div class="client-info">

          <strong>
            ${product.name}
          </strong>

          <br>

          Réf :
          ${product.reference || "-"}

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
          ${product.stock}

        </div>

        <div>

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

await apiFetch("/api/products", {

      method: "POST",

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

    loadProducts();

    loadInvoiceData();

    showToast("Produit ajouté ✅");

  } catch (err) {

    showToast(err.message);
  }

  hideLoader();
}

// ================= DELETE PRODUCTS =================

async function deleteProduct(id) {

 await apiFetch(
  `/api/products/${id}`,
    {
      method: "DELETE"
    }
  );

  loadProducts();

  loadInvoiceData();

  showToast("Produit supprimé 🗑️");
}
