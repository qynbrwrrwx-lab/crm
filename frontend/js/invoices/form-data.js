// Formulaires commerciaux : voir README.md.

function renderInvoiceContactOptions(contacts) {
  return ['<option value="">Sélectionner un contact</option>', ...contacts.map(contact => `<option value="${contact._id}">
    ${escapeHtml(contact.firstname)}
    ${escapeHtml(contact.lastname)}
    ${escapeHtml(contact.companyName)}
  </option>`)].join("");
}

function renderInvoiceProductOptions(products) {
  return ['<option value="">Sélectionner un produit</option>', ...products.map(product => `<option value="${product._id}">
    ${escapeHtml(product.name)}
    (${product.stock} stock)
  </option>`)].join("");
}

function renderQuoteContactOptions(contacts) {
  return ['<option value="">Sélectionner un contact</option>', ...contacts.map(contact => `<option value="${contact._id}">
    ${escapeHtml(contact.firstname)}
    ${escapeHtml(contact.lastname)}
  </option>`)].join("");
}

function renderQuoteProductOptions(products) {
  return ['<option value="">Sélectionner un produit</option>', ...products.map(product => `<option value="${product._id}">
    ${escapeHtml(product.name)} — stock : ${Number(product.stock || 0)}
  </option>`)].join("");
}

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

  contactSelect.innerHTML = renderInvoiceContactOptions(contacts);
  productSelect.innerHTML = renderInvoiceProductOptions(products);
}

function getQuoteClientContextPresentation(contact) {
  if (!contact) {
    return {
      label: "Client destinataire",
      name: "Sélectionnez un client pour afficher ses coordonnées.",
      details: ""
    };
  }
  return {
    label: "Client destinataire",
    name: contact.companyName || `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || "Client",
    details: [contact.email, contact.phone, contact.billingAddress].filter(Boolean).join(" · ") || "Coordonnées à compléter dans la fiche client"
  };
}

function updateQuoteClientContext() {
  const container = document.getElementById("quoteClientContext");
  const contactId = document.getElementById("quoteContact")?.value;
  if (!container) return;

  const presentation = getQuoteClientContextPresentation(quoteContactsById.get(contactId));
  container.innerHTML = `<span>${presentation.label}</span><strong>${escapeHtml(presentation.name)}</strong>${presentation.details ? `<small>${escapeHtml(presentation.details)}</small>` : ""}`;
}

function getQuoteDraftSummaryPresentation(summary) {
  const hasShortages = summary.shortages.length > 0;
  const hasSelectedLines = summary.selectedLines.length > 0;
  return {
    countLabel: `${summary.count} article${summary.count > 1 ? "s" : ""}`,
    totalLabel: formatDocumentCurrency(summary.total),
    availabilityLabel: hasShortages ? "Stock insuffisant sur un ou plusieurs articles" : (hasSelectedLines ? "Stock disponible" : "Disponibilité à vérifier"),
    isWarning: hasShortages,
    isSuccess: hasSelectedLines && !hasShortages
  };
}

function updateQuoteDraftSummary() {
  const lines = [...document.querySelectorAll(".quote-line")];
  const presentation = getQuoteDraftSummaryPresentation(getQuoteDraftSummary(lines, quoteProductsById));
  const countEl = document.getElementById("quoteDraftCount");
  const totalEl = document.getElementById("quoteDraftTotal");
  const availabilityEl = document.getElementById("quoteDraftAvailability");
  if (countEl) countEl.textContent = presentation.countLabel;
  if (totalEl) totalEl.textContent = presentation.totalLabel;
  if (availabilityEl) {
    availabilityEl.textContent = presentation.availabilityLabel;
    availabilityEl.classList.toggle("is-warning", presentation.isWarning);
    availabilityEl.classList.toggle("is-success", presentation.isSuccess);
  }
}

async function loadQuoteData() {

  const contacts =
    await apiFetch("/api/contacts");

  const products =
    await apiFetch("/api/products");

  quoteProductsById = new Map(products.map(product => [product._id, product]));
  quoteContactsById = new Map(contacts.map(contact => [contact._id, contact]));


  const contactSelect =
    document.getElementById("quoteContact");

  const productSelects =
  document.querySelectorAll(".quote-product");

    if (!contactSelect) return;

  contactSelect.innerHTML = renderQuoteContactOptions(contacts);

  productSelects.forEach(select => {
    select.innerHTML = renderQuoteProductOptions(products);

});

  document.querySelectorAll(".quote-product, .quote-quantity").forEach(field => {
    field.onchange = updateQuoteDraftSummary;
    field.oninput = updateQuoteDraftSummary;
  });

  contactSelect.onchange = updateQuoteClientContext;
  updateQuoteClientContext();

  updateQuoteDraftSummary();
}
