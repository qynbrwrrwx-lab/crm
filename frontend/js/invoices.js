// ================= INVOICES =================

let editingQuoteId = null;
let isEditingQuote = false;
let currentInvoiceId = null;

// LOAD SELECT DATA
async function loadInvoiceData() {

  const contacts =
  await apiFetch("/api/contacts");

 const products =
  await apiFetch("/api/products");

  const contactSelect =
    document.getElementById("invoiceContact");

  const productSelect =
    document.getElementById("invoiceProduct");

  if (!contactSelect || !productSelect) return;

  // CONTACTS
  contactSelect.innerHTML =
    `<option value="">Sélectionner un contact</option>`;

  contacts.forEach(contact => {

    contactSelect.innerHTML += `
      <option value="${contact._id}">
        ${contact.firstname || ""}
        ${contact.lastname || ""}
        ${contact.companyName || ""}
      </option>
    `;
  });

  // PRODUCTS
  productSelect.innerHTML =
    `<option value="">Sélectionner un produit</option>`;

  products.forEach(product => {

    productSelect.innerHTML += `
      <option value="${product._id}">
        ${product.name}
        (${product.stock} stock)
      </option>
    `;
  });
}

// LOAD INVOICES
async function loadInvoices() {

  try {

    const invoices =
  await apiFetch("/api/invoices");

    renderInvoices(invoices);

  } catch (err) {

    console.error(err);

    showToast(err.message);
  }
}

// RENDER INVOICES
function renderInvoices(invoices) {

  const invoiceList =
    document.getElementById("invoiceList");

  const quotesList =
    document.getElementById("quotesContainer");

  const acceptedQuotesList =
    document.getElementById("acceptedQuotesContainer");

  if (
  !invoiceList ||
  !quotesList ||
  !acceptedQuotesList
) return;

  invoiceList.innerHTML = "";
  quotesList.innerHTML = "";
  acceptedQuotesList.innerHTML = "";

const quotes =
  invoices.filter(
    i =>
      i.type === "quote" &&
      i.status !== "accepted"
  );

const acceptedQuotes =
  invoices.filter(
    i =>
      i.type === "quote" &&
      i.status === "accepted"
  );

document.getElementById(
  "quotesCount"
).textContent =
  `${quotes.length} devis`;

document.getElementById(
  "acceptedQuotesCount"
).textContent =
  `${acceptedQuotes.length} devis`;

  invoices.forEach(invoice => {

  const date = new Date(invoice.createdAt);

const day =
  String(date.getDate()).padStart(2, "0");

const month =
  date.toLocaleString(
    "fr-FR",
    { month: "short" }
  );

const customerName =
  invoice.contactId?.companyName ||
  `${invoice.contactId?.firstname || ""}
   ${invoice.contactId?.lastname || ""}`;

console.log(invoice);

const articlesCount =
  invoice.products?.length || 0;

const html = `

<div
  class="erp-row"
  onclick="openInvoice('${invoice._id}')"
>

  <div class="erp-date">

    <div class="erp-day">
      ${day}
    </div>

    <div class="erp-month">
      ${month}
    </div>

  </div>

  <div class="erp-customer">

    <div class="erp-number">
      ${invoice.invoiceNumber}
    </div>

    <div class="erp-name">
      ${customerName}
    </div>

    <div class="erp-items">
      ${articlesCount} articles${articlesCount > 1 ? "s" : ""}
    </div>

  </div>

  <div class="erp-amounts">

    <div>
      ${Number(invoice.totalTTC).toFixed(2)} €
      TTC
    </div>

    <small>
      ${Number(invoice.totalHT).toFixed(2)} €
      HT
    </small>

  </div>

</div>

`;
   
   if (invoice.type === "quote") {

  if (invoice.status === "accepted") {

    acceptedQuotesList.innerHTML += html;

  } else {

    quotesList.innerHTML += html;

  }

} else {

  invoiceList.innerHTML += html;

    }
  });
}

// CREATE INVOICE
async function createInvoice() {

  const contactId =
    document.getElementById("invoiceContact").value;

  const productId =
    document.getElementById("invoiceProduct").value;

  const quantity =
    document.getElementById("invoiceQuantity").value;

  const type = "invoice";

  const paymentMethod =
    document.getElementById("paymentMethod").value;

  if (!contactId || !productId) {

    showToast(
      "Contact et produit obligatoires ❗"
    );

    return;
  }

  showLoader();

  try {

    await apiFetch("/api/invoices", {

      method: "POST",

      body: JSON.stringify({

        type,
        contactId,
        paymentMethod,

        products: [
          {
            productId,
            quantity: Number(quantity)
          }
        ]
      })
    });

    await loadInvoices();

    await loadProducts();

    await loadInvoiceData();

    showToast("Document créé ✅");

  } catch (err) {

    console.error(err);

    showToast(
      err.message || "Erreur API"
    );

  } finally {

    hideLoader();
  }
}

// MARK PAID
async function markInvoicePaid(id) {

  try {

   await apiFetch(
  `/api/invoices/pay/${id}`,
      {
        method: "PUT"
      }
    );

    await loadInvoices();

    showToast(
      "Facture payée ✅"
    );

  } catch (err) {

    console.error(err);

    showToast(err.message);
  }
}

// DELETE INVOICE
async function deleteInvoice(id) {

  try {

    await apiFetch(
  `/api/invoices/${id}`,
      {
        method: "DELETE"
      }
    );

    await loadInvoices();

    showToast(
      "Document supprimé 🗑️"
    );

  } catch (err) {

    console.error(err);

    showToast(err.message);
  }
}

async function loadQuoteData() {

  console.log("LOAD QUOTES DATA EXECUTE");

  const contacts =
    await apiFetch("/api/contacts");

    console.log("CONTACTS =", contacts);

  const products =
    await apiFetch("/api/products");

    console.log("PRODUCTS =", products);

  const contactSelect =
    document.getElementById("quoteContact");

  const productSelects =
  document.querySelectorAll(".quote-product");

    if (!contactSelect) return;

  contactSelect.innerHTML =
    '<option value="">Sélectionner un contact</option>';

 contacts.forEach(contact => {

    contactSelect.innerHTML += `
      <option value="${contact._id}">
        ${contact.firstname || ""}
        ${contact.lastname || ""}
      </option>
    `;
  });

  productSelects.forEach(select => {

  select.innerHTML =
    '<option value="">Sélectionner un produit</option>';

  products.forEach(product => {

    select.innerHTML += `
      <option value="${product._id}">
        ${product.name}
      </option>
    `;

  });

});
}

// ================= ORDER TABS =================

function showOrderTab(tabId) {

  document
    .querySelectorAll(".order-tab")
    .forEach(tab => {

      tab.classList.remove("active");

    });

  document
    .getElementById(tabId)
    ?.classList.add("active");
}



window.toggleQuoteForm = async function() {

  const form =
    document.getElementById("quoteModal");

  if (!form) return;

  const opening =
    form.style.display === "none";

  form.style.display =
    opening ? "block" : "none";

  if (opening) {

    console.log("QUOTES OPEN");

    await loadQuoteData();

  }
}

// ================= CREATE QUOTES =================

async function createQuote() {

  const contactId =
    document.getElementById("quoteContact").value;

  const products = [];

document
  .querySelectorAll(".quote-line")
  .forEach(line => {

    const productId =
      line.querySelector(".quote-product").value;

    const quantity =
      parseInt(
        line.querySelector(".quote-quantity").value
      );

    if (productId && quantity > 0) {

      products.push({
        productId,
        quantity,
        discount: 0
      });

    }

  });

  if (!contactId) {
    return showToast("Sélectionnez un contact");
  }

  if (products.length === 0) {
  return showToast(
    "Ajoutez au moins un article"
  );
}

  try {

    const method =
  editingQuoteId ? "PUT" : "POST";

    const url =
  editingQuoteId
    ? `/api/invoices/${editingQuoteId}`
    : "/api/invoices";

    await apiFetch(url, {

     method,

      body: JSON.stringify({

        type: "quote",

        contactId,

        paymentMethod: "pending",

        products
})

    });

    await loadInvoices();

    editingQuoteId = null;

    showToast(
    editingQuoteId
    ? "Devis modifié ✅"
    : "Devis créé ✅"
 );

    editingQuoteId = null;

    closeQuoteModal();

  } catch (err) {

    console.error(err);

    showToast(err.message);

  }

}

    function closeQuoteModal() {

  const modal =
    document.getElementById("quoteModal");

  if (!modal) return;

  modal.style.display = "none";
}

// ================= CREATE QUOTES =================

async function acceptQuote(id) {

  try {

    await apiFetch(
      `/api/invoices/accept/${id}`,
      {
        method: "PUT"
      }
    );

    await loadInvoices();

    showToast("Devis accepté");

  } catch (err) {

    console.error(err);

    showToast(err.message);

  }
}

function viewQuote(id) {

  window.open(
    `/api/invoices/pdf/${id}`,
    "_blank"
  );

}

async function editQuote(id) {

  const invoices =
    await apiFetch("/api/invoices");

  const quote =
    invoices.find(i => i._id === id);

  if (!quote) return;

  editingQuoteId = id;

  document.getElementById("quoteContact").value =
    quote.contactId;

  const firstProduct =
  document.querySelector(".quote-product");

  const firstQuantity =
  document.querySelector(".quote-quantity");

    if (firstProduct) {
  firstProduct.value =
    quote.products[0].productId;
}

    if (firstQuantity) {
  firstQuantity.value =
    quote.products[0].quantity;
}

  document.getElementById("quoteModal").style.display =
    "block";

}

function addQuoteLine() {

  const container =
    document.getElementById("quoteLines");

  if (!container) return;

  const firstSelect =
    document.querySelector(".quote-product");

  const options =
    firstSelect
      ? firstSelect.innerHTML
      : '<option value="">Sélectionner un produit</option>';

  const line =
    document.createElement("div");

  line.className = "quote-line";

  line.innerHTML = `

    <select class="quote-product">
      ${options}
    </select>

    <input
      class="quote-quantity"
      type="number"
      min="1"
      value="1"
    />

    <button
      type="button"
      onclick="this.parentElement.remove()"
    >
      X
    </button>

  `;

  container.appendChild(line);

}

async function openInvoice(id) {

  currentInvoiceId = id;

  const invoices =
    await apiFetch("/api/invoices");

  const invoice =
    invoices.find(i => i._id === id);

  if (!invoice) return;

  document.getElementById(
    "invoiceDetailsModal"
  ).style.display = "flex";

  document.getElementById(
    "detailNumber"
  ).innerText =
    invoice.invoiceNumber;

  document.getElementById(
  "invoiceDetailsBody"
).innerHTML = `

  <div class="invoice-detail-card">

    <h3>
      ${
        invoice.contactId?.companyName || `${invoice.contactId?.firstname || ""} ${invoice.contactId?.lastname || ""}`.trim()
      }
    </h3>

    <hr>

<h4>Articles</h4>

<div class="quote-table-header">

    <div>Produit</div>
    <div>Qté</div>
    <div>PU HT</div>
    <div>Total</div>

</div>

${invoice.products.map(item => `

<div class="quote-product-row">

    <div class="quote-product-name">
        ${item.productId.name}
    </div>

    <div class="quote-product-qty">

${
    isEditingQuote
    ? `
        <input
            type="number"
            min="1"
            value="${item.quantity}"
            class="edit-qty"
            style="
                width:60px;
                text-align:center;
            "
        >
      `
    : item.quantity
}

</div>

    <div class="quote-product-price">
        ${item.productId.priceHT.toFixed(2)} €
    </div>

    <div class="quote-product-total">
        ${(item.productId.priceHT * item.quantity).toFixed(2)} €
    </div>

</div>

`).join("")}

<br>

<p>
<strong>Total HT :</strong>
${invoice.totalHT.toFixed(2)} €
</p>

<p>
<strong>Total TTC :</strong>
${invoice.totalTTC.toFixed(2)} €
</p>


    <div
      class="invoice-detail-actions"
      style="
        margin-top:30px;
        display:flex;
        gap:10px;
      "
      >

      <button
        id="editInvoiceBtn"
        class="primary-btn"
        onclick="enableInvoiceEdition()"
      >
        Modifier
      </button>

      <button
        class="secondary-btn"
        onclick="deleteInvoice('${invoice._id}')"
      >
        Supprimer
      </button>

      <button
        class="secondary-btn"
        onclick="closeInvoiceDetails()"
      >
        Fermer
      </button>

    </div>

  </div>

`;

}

function enableInvoiceEdition() {

    isEditingQuote = true;

    openInvoice(currentInvoiceId);

}

function closeInvoiceDetails() {

    isEditingQuote = false;
    currentInvoiceId = null;

    document.getElementById(
        "invoiceDetailsModal"
    ).style.display = "none";

}