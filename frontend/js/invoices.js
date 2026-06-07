// ================= INVOICES =================

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

  invoices.forEach(invoice => {

    const html = `

      <div class="client">

        <div class="client-info">

          <strong>
            ${invoice.invoiceNumber}
          </strong>

          <br>

          ${
            invoice.type === "quote"
            ? "📄 Devis"
            : "🧾 Facture"
          }

          <br>

          Total TTC :
          ${Number(invoice.totalTTC).toFixed(2)} €

          <br>

          Paiement :
          ${invoice.paymentMethod}

          <br>

          Statut :
          ${
            invoice.paymentStatus === "paid"
            ? "✅ Payé"
            : "⌛ En attente"
          }

    <div>

  ${
    invoice.type === "quote"
    ? `
      <button
        onclick="viewQuote('${invoice._id}')"
      >
        Voir
      </button>

      <button
        onclick="acceptQuote('${invoice._id}')"
      >
        Accepter
      </button>

      <button
        onclick="deleteInvoice('${invoice._id}')"
      >
        Supprimer
      </button>
    `
    : `
      ${
        invoice.paymentStatus !== "paid"
        ? `
          <button
            onclick="markInvoicePaid('${invoice._id}')"
          >
            Marquer payé
          </button>
        `
        : ""
      }

      <button
        onclick="deleteInvoice('${invoice._id}')"
      >
        Supprimer
      </button>
    `
  }

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

  const productSelect =
    document.getElementById("quoteProduct");

  if (!contactSelect || !productSelect) return;

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

  productSelect.innerHTML =
    '<option value="">Sélectionner un produit</option>';

  products.forEach(product => {

    productSelect.innerHTML += `
      <option value="${product._id}">
        ${product.name}
      </option>
    `;
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

  const productId =
    document.getElementById("quoteProduct").value;

  const quantity =
    parseInt(
      document.getElementById("quoteQuantity").value
    );

  if (!contactId) {
    return showToast("Sélectionnez un contact");
  }

  if (!productId) {
    return showToast("Sélectionnez un produit");
  }

  try {

    await apiFetch("/api/invoices", {

      method: "POST",

      body: JSON.stringify({

        type: "quote",

        contactId,

        paymentMethod: "pending",

        products: [
            {
        
        productId,
        quantity
      }
    ]
})

    });

    await loadInvoices();

    showToast("Devis créé ✅");

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