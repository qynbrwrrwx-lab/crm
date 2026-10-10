// Produits : activity. Voir README.md.

const productDocumentLabels = { quote: "Devis", order: "Commande", invoice: "Facture", credit_note: "Avoir" };

function matchesProductId(item, productId) {
  return String(item.productId?._id || item.productId || "") === String(productId);
}

function getProductCommercialSummaryFromInvoices(invoices, productId) {
  const relatedDocuments = invoices
    .filter(document => Array.isArray(document.products) && document.products.some(item => matchesProductId(item, productId)))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  const paidLines = relatedDocuments
    .filter(document => document.type === "invoice" && document.paymentStatus === "paid")
    .flatMap(document => document.products.filter(item => matchesProductId(item, productId)));
  return {
    quantitySold: paidLines.reduce((total, item) => total + Number(item.quantity || 0), 0),
    revenue: paidLines.reduce((total, item) => total + Number(item.lineTTC || 0), 0),
    lastDocument: relatedDocuments[0] || null,
    relatedDocuments
  };
}

async function getProductCommercialSummary(productId) {
  try {
    const invoices = await apiFetch("/api/invoices");
    return getProductCommercialSummaryFromInvoices(invoices, productId);
  } catch (err) {
    console.error(err);
    return { quantitySold: 0, revenue: 0, lastDocument: null, relatedDocuments: [], unavailable: true };
  }
}

function renderProductCommercialSummary(summary) {
  const quantity = document.getElementById("productSoldQuantity");
  const revenue = document.getElementById("productRevenue");
  const lastDocument = document.getElementById("productLastDocument");
  const lastDocumentDate = document.getElementById("productLastDocumentDate");
  if (!quantity || !revenue || !lastDocument || !lastDocumentDate) return;

  if (summary.unavailable) {
    quantity.textContent = "Indisponible";
    revenue.textContent = "Indisponible";
    lastDocument.textContent = "Activité indisponible";
    lastDocumentDate.textContent = "Réessayez dans quelques instants";
    renderProductDocumentHistory([]);
    return;
  }

  quantity.textContent = `${summary.quantitySold} unité${summary.quantitySold > 1 ? "s" : ""}`;
  revenue.textContent = formatProductCurrency(summary.revenue);
  renderProductDocumentHistory(summary.relatedDocuments);

  const latestDocument = summary.lastDocument;
  if (!latestDocument) {
    lastDocument.textContent = "Aucun document";
    lastDocumentDate.textContent = "Ce produit n’a pas encore été utilisé";
    return;
  }

  lastDocument.textContent = `${productDocumentLabels[latestDocument.type] || "Document"} · ${latestDocument.invoiceNumber || "Sans numéro"}`;
  lastDocumentDate.textContent = new Date(latestDocument.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric"
  });
}

function renderProductDocumentHistory(documents) {
  const count = document.getElementById("productDocumentCount");
  const list = document.getElementById("productDocumentHistory");
  if (!count || !list) return;

  count.textContent = `${documents.length} document${documents.length > 1 ? "s" : ""}`;
  if (!documents.length) {
    list.innerHTML = '<p class="empty-state">Aucun document commercial ne contient encore ce produit.</p>';
    return;
  }

  list.innerHTML = documents.slice(0, 5).map(item => {
    const label = productDocumentLabels[item.type] || "Document";
    const payment = item.type === "invoice"
      ? (item.paymentStatus === "paid" ? "Encaissée" : "À encaisser")
      : "Voir le détail";
    const date = new Date(item.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    return `<button type="button" class="product-document-row" onclick="closeRestockModal(); openInvoice('${item._id}')">
      <span class="product-document-type">${label}</span>
      <span class="product-document-main"><strong>${escapeHtml(item.invoiceNumber || "Sans numéro")}</strong><small>${date} · ${payment}</small></span>
      <span class="product-document-total">${formatProductCurrency(item.totalTTC)}</span>
    </button>`;
  }).join("");
}
