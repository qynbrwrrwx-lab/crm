// Formulaires commerciaux : voir README.md.

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
        ${escapeHtml(contact.firstname)}
        ${escapeHtml(contact.lastname)}
        ${escapeHtml(contact.companyName)}
      </option>
    `;
  });

  // PRODUCTS
  productSelect.innerHTML =
    `<option value="">Sélectionner un produit</option>`;

  products.forEach(product => {

    productSelect.innerHTML += `
      <option value="${product._id}">
        ${escapeHtml(product.name)}
        (${product.stock} stock)
      </option>
    `;
  });
}

function updateQuoteClientContext() {
  const container = document.getElementById("quoteClientContext");
  const contactId = document.getElementById("quoteContact")?.value;
  if (!container) return;

  const contact = quoteContactsById.get(contactId);
  if (!contact) {
    container.innerHTML = "<span>Client destinataire</span><strong>Sélectionnez un client pour afficher ses coordonnées.</strong>";
    return;
  }

  const name = contact.companyName || `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || "Client";
  const details = [contact.email, contact.phone, contact.billingAddress].filter(Boolean).join(" · ");
  container.innerHTML = `<span>Client destinataire</span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(details || "Coordonnées à compléter dans la fiche client")}</small>`;
}

function updateQuoteDraftSummary() {
  const lines = [...document.querySelectorAll(".quote-line")];
  const { selectedLines, count, total, shortages } = getQuoteDraftSummary(lines, quoteProductsById);
  const countEl = document.getElementById("quoteDraftCount");
  const totalEl = document.getElementById("quoteDraftTotal");
  const availabilityEl = document.getElementById("quoteDraftAvailability");
  if (countEl) countEl.textContent = `${count} article${count > 1 ? "s" : ""}`;
  if (totalEl) totalEl.textContent = formatDocumentCurrency(total);
  if (availabilityEl) {
    availabilityEl.textContent = shortages.length ? "Stock insuffisant sur un ou plusieurs articles" : (selectedLines.length ? "Stock disponible" : "Disponibilité à vérifier");
    availabilityEl.classList.toggle("is-warning", shortages.length > 0);
    availabilityEl.classList.toggle("is-success", selectedLines.length > 0 && shortages.length === 0);
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

  contactSelect.innerHTML =
    '<option value="">Sélectionner un contact</option>';

 contacts.forEach(contact => {

    contactSelect.innerHTML += `
      <option value="${contact._id}">
        ${escapeHtml(contact.firstname)}
        ${escapeHtml(contact.lastname)}
      </option>
    `;
  });

  productSelects.forEach(select => {

  select.innerHTML =
    '<option value="">Sélectionner un produit</option>';

  products.forEach(product => {

    select.innerHTML += `
      <option value="${product._id}">
        ${escapeHtml(product.name)} — stock : ${Number(product.stock || 0)}
      </option>
    `;

  });

});

  document.querySelectorAll(".quote-product, .quote-quantity").forEach(field => {
    field.onchange = updateQuoteDraftSummary;
    field.oninput = updateQuoteDraftSummary;
  });

  contactSelect.onchange = updateQuoteClientContext;
  updateQuoteClientContext();

  updateQuoteDraftSummary();
}
