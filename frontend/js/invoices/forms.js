// Formulaires commerciaux : voir README.md.

function readInvoiceCreationForm() {
  return {
    contactId: document.getElementById("invoiceContact").value,
    productId: document.getElementById("invoiceProduct").value,
    quantity: Number(document.getElementById("invoiceQuantity").value),
    paymentMethod: document.getElementById("paymentMethod").value
  };
}

function buildInvoiceCreationPayload({ contactId, productId, quantity, paymentMethod }) {
  return {
    type: "invoice",
    contactId,
    paymentMethod,
    products: [{ productId, quantity }]
  };
}

async function createInvoice() {
  const form = readInvoiceCreationForm();
  if (!form.contactId || !form.productId) {
    showToast("Contact et produit obligatoires ❗");
    return;
  }
  const lockKey = "invoice:create";
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  showLoader();
  try {
    await apiFetch("/api/invoices", { method: "POST", body: JSON.stringify(buildInvoiceCreationPayload(form)) });
    await loadInvoices();
    await loadProducts();
    await loadInvoiceData();
    showToast("Document créé ✅");
  } catch (err) {
    console.error(err);
    showToast(err.message || "Erreur API");
  } finally {
    documentActionLocks.delete(lockKey);
    hideLoader();
  }
}

function readQuoteProducts() {
  const products = [];
  document.querySelectorAll(".quote-line").forEach(line => {
    const productId = line.querySelector(".quote-product").value;
    const quantity = parseInt(line.querySelector(".quote-quantity").value);
    if (productId && quantity > 0) products.push({ productId, quantity, discount: 0 });
  });
  return products;
}

async function createQuote() {
  const contactId = document.getElementById("quoteContact").value;
  const products = readQuoteProducts();

  if (!contactId) {
    return showToast("Sélectionnez un contact");
  }

  if (products.length === 0) {
  return showToast(
    "Ajoutez au moins un article"
  );
}

  const quoteId = editingQuoteId;
  const lockKey = `quote:${quoteId || "new"}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  try {
  const isEditingExistingQuote = Boolean(quoteId);
  const method = isEditingExistingQuote ? "PUT" : "POST";
    const url = isEditingExistingQuote ? `/api/invoices/${quoteId}` : "/api/invoices";

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
    showToast(isEditingExistingQuote ? "Devis modifié ✅" : "Devis créé ✅");
    closeQuoteModal();
  } catch (err) {
    console.error(err);
    showToast(err.message);
  } finally {
    documentActionLocks.delete(lockKey);
  }
}
