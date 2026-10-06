// Documents commerciaux : editor. Voir README.md pour les responsabilités.

function enableInvoiceEdition() {
  isEditingQuote = true;
  openInvoice(currentInvoiceId);
}

function applyInvoiceEditorInputs() {
  const quantityInputs = document.querySelectorAll(".edit-qty");
  const discountInputs = document.querySelectorAll(".edit-discount");
  quantityInputs.forEach((input, index) => {
    const line = currentInvoice.products[index];
    if (!line) return;
    line.quantity = Number(input.value);
    line.discount = Number(discountInputs[index]?.value) || 0;
  });
}

async function saveInvoiceEdition() {
  try {
    applyInvoiceEditorInputs();
    await apiFetch(`/api/invoices/${currentInvoice._id}`, {
      method: "PUT",
      body: JSON.stringify({ contactId: currentInvoice.contactId, products: currentInvoice.products })
    });
    isEditingQuote = false;
    await loadInvoices();
    closeInvoiceDetails();
    showToast("Devis enregistré ✅");
  } catch (err) {
    console.error(err);
    showToast(err.message);
  }
}

function renderInvoiceLineTotals() {
  document.querySelectorAll(".line-total-ht").forEach((cell, index) => {
    cell.textContent = `${currentInvoice.products[index].lineHT.toFixed(2)} €`;
  });
  document.querySelectorAll(".line-total-ttc").forEach((cell, index) => {
    cell.textContent = `${currentInvoice.products[index].lineTTC.toFixed(2)} €`;
  });
}

function renderInvoiceSummaryTotals() {
  const values = {
    summaryTotalHT: currentInvoice.totalHT,
    summaryTVA: currentInvoice.totalTTC - currentInvoice.totalHT,
    summaryTotalTTC: currentInvoice.totalTTC
  };
  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = `${value.toFixed(2)} €`;
  });
}

async function openAddProductModal() {
  availableProducts = await apiFetch("/api/products");
  renderInvoiceProductPicker(availableProducts);
  document.getElementById("addProductModal").style.display = "flex";
}

function addProductToInvoice(productId) {
  if (!addInvoiceProduct(availableProducts, productId)) return;
  document.getElementById("addProductModal").style.display = "none";
  recalculateInvoice();
}

function closeAddProductModal() {
  document.getElementById("addProductModal").style.display = "none";
}

function removeInvoiceLine(index) {
  currentInvoice.products.splice(index, 1);
  isEditingQuote = true;
  openInvoice(currentInvoiceId);
}

function recalculateInvoice() {
  applyInvoiceEditorInputs();
  currentInvoice.products.forEach(item => recalculateInvoiceLine(item, isEditingQuote));
  const totals = getInvoiceTotals(currentInvoice.products);
  currentInvoice.totalHT = totals.totalHT;
  currentInvoice.totalTTC = totals.totalTTC;
  renderInvoiceLineTotals();
  renderInvoiceSummaryTotals();
}
