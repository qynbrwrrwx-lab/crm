// Formulaires commerciaux : voir README.md.

window.toggleQuoteForm = async function() {

  const form =
    document.getElementById("quoteModal");

  if (!form) return;

  const opening =
    form.style.display === "none";

  form.style.display =
    opening ? "block" : "none";

  if (opening) {

    await loadQuoteData();

  }
};

function closeQuoteModal() {

  const modal =
    document.getElementById("quoteModal");

  if (!modal) return;

  modal.style.display = "none";
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
      class="quote-remove-line-btn"
      aria-label="Retirer cet article du devis"
      title="Retirer cet article"
      onclick="this.parentElement.remove(); updateQuoteDraftSummary()"
    >
      Retirer
    </button>

  `;

  container.appendChild(line);
  line.querySelectorAll(".quote-product, .quote-quantity").forEach(field => {
    field.onchange = updateQuoteDraftSummary;
    field.oninput = updateQuoteDraftSummary;
  });
  updateQuoteDraftSummary();

}
