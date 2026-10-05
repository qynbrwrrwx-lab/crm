// Formulaires commerciaux : voir README.md.

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

  const isEditingExistingQuote = Boolean(editingQuoteId);

  const method =
  isEditingExistingQuote ? "PUT" : "POST";

    const url =
  isEditingExistingQuote
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

    showToast(isEditingExistingQuote ? "Devis modifié ✅" : "Devis créé ✅");

    editingQuoteId = null;

    closeQuoteModal();

  } catch (err) {

    console.error(err);

    showToast(err.message);

  }

}
