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

function getProductDocumentHistoryPresentation(documents) {
  return {
    countLabel: `${documents.length} document${documents.length > 1 ? "s" : ""}`,
    emptyMessage: "Aucun document commercial ne contient encore ce produit.",
    items: documents.slice(0, 5).map(getProductDocumentPresentation)
  };
}

function getProductCommercialSummaryPresentation(summary) {
  if (summary.unavailable) {
    return {
      quantityLabel: "Indisponible",
      revenueLabel: "Indisponible",
      lastDocumentLabel: "Activité indisponible",
      lastDocumentDateLabel: "Réessayez dans quelques instants",
      history: getProductDocumentHistoryPresentation([])
    };
  }
  const latestDocument = summary.lastDocument;
  if (!latestDocument) {
    return {
      quantityLabel: `${summary.quantitySold} unité${summary.quantitySold > 1 ? "s" : ""}`,
      revenueLabel: formatProductCurrency(summary.revenue),
      lastDocumentLabel: "Aucun document",
      lastDocumentDateLabel: "Ce produit n’a pas encore été utilisé",
      history: getProductDocumentHistoryPresentation(summary.relatedDocuments)
    };
  }
  return {
    quantityLabel: `${summary.quantitySold} unité${summary.quantitySold > 1 ? "s" : ""}`,
    revenueLabel: formatProductCurrency(summary.revenue),
    lastDocumentLabel: `${productDocumentLabels[latestDocument.type] || "Document"} · ${latestDocument.invoiceNumber || "Sans numéro"}`,
    lastDocumentDateLabel: new Date(latestDocument.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
    history: getProductDocumentHistoryPresentation(summary.relatedDocuments)
  };
}

function renderProductCommercialSummary(summary) {
  const quantity = document.getElementById("productSoldQuantity");
  const revenue = document.getElementById("productRevenue");
  const lastDocument = document.getElementById("productLastDocument");
  const lastDocumentDate = document.getElementById("productLastDocumentDate");
  if (!quantity || !revenue || !lastDocument || !lastDocumentDate) return;

  const presentation = getProductCommercialSummaryPresentation(summary);
  quantity.textContent = presentation.quantityLabel;
  revenue.textContent = presentation.revenueLabel;
  lastDocument.textContent = presentation.lastDocumentLabel;
  lastDocumentDate.textContent = presentation.lastDocumentDateLabel;
  renderProductDocumentHistoryPresentation(presentation.history);
}

function renderProductDocumentHistory(documents) {
  renderProductDocumentHistoryPresentation(getProductDocumentHistoryPresentation(documents));
}

function renderProductDocumentHistoryPresentation(presentation) {
  const count = document.getElementById("productDocumentCount");
  const list = document.getElementById("productDocumentHistory");
  if (!count || !list) return;

  count.textContent = presentation.countLabel;
  if (!presentation.items.length) {
    list.innerHTML = `<p class="empty-state">${presentation.emptyMessage}</p>`;
    return;
  }

  list.innerHTML = presentation.items.map(item => {
    return `<button type="button" class="product-document-row" onclick="closeRestockModal(); openInvoice('${item.id}')">
      <span class="product-document-type">${item.typeLabel}</span>
      <span class="product-document-main"><strong>${escapeHtml(item.number)}</strong><small>${item.dateLabel} · ${item.paymentLabel}</small></span>
      <span class="product-document-total">${item.totalLabel}</span>
    </button>`;
  }).join("");
}

function getProductDocumentPresentation(document) {
  return {
    id: document._id,
    typeLabel: productDocumentLabels[document.type] || "Document",
    number: document.invoiceNumber || "Sans numéro",
    paymentLabel: document.type === "invoice"
      ? (document.paymentStatus === "paid" ? "Encaissée" : "À encaisser")
      : "Voir le détail",
    dateLabel: new Date(document.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
    totalLabel: formatProductCurrency(document.totalTTC)
  };
}
