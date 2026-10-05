// Lignes et totaux éditables de la fiche document.
function renderInvoiceDetailProducts(currentInvoice, isEditingQuote) {
  const rows = currentInvoice.products.map((item, itemIndex) => `
    <div class="quote-product-row">
      <div class="quote-product-name">${escapeHtml(item.productName || item.productId?.name)}</div>
      <div class="quote-product-qty">${isEditingQuote
        ? `<input type="number" min="1" value="${item.quantity}" class="edit-qty" oninput="recalculateInvoice()" style="width:60px;text-align:center;">`
        : item.quantity}</div>
      <div class="quote-product-price">${formatDocumentCurrency(item.unitHT)}</div>
      <div class="quote-product-price-ttc">${formatDocumentCurrency(item.unitTTC)}</div>
      <div class="quote-product-discount">${isEditingQuote
        ? `<input type="number" min="0" max="100" value="${item.discount || 0}" class="edit-discount" oninput="recalculateInvoice()" style="width:65px;text-align:center;">`
        : `${item.discount || 0} %`}</div>
      <div class="quote-product-total line-total-ht">${formatDocumentCurrency(item.lineHT)}</div>
      <div class="quote-product-total-ttc line-total-ttc">${formatDocumentCurrency(item.lineTTC)}</div>
      <div class="quote-product-delete">${isEditingQuote
        ? `<button class="delete-line-btn" onclick="removeInvoiceLine(${itemIndex})">✕</button>`
        : ""}</div>
    </div>
  `).join("");

  return `
    ${isEditingQuote ? `<div class="quote-toolbar"><button class="primary-btn" onclick="openAddProductModal()">➕ Ajouter un produit</button></div>` : ""}
    <h4>Articles</h4>
    <div class="quote-table-header"><div>Produit</div><div>Qté</div><div>PU HT</div><div>PU TTC</div><div>Remise</div><div>Total HT</div><div>TOTAL TTC</div><div></div></div>
    ${rows}
    <br>
  `;
}
