// Tableau de bord : activity.

const commercialDocumentLabels = { quote: "Devis", order: "Commande", invoice: "Facture", credit_note: "Avoir" };

function getRecentCommercialDocuments(documents) {
  return [...documents]
    .sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt))
    .slice(0, 6);
}

function getCommercialDocumentClient(document) {
  return document.contactId?.companyName
    || `${document.contactId?.firstname || ""} ${document.contactId?.lastname || ""}`.trim()
    || "Client non renseigné";
}

function getRecentActivityPresentation(document) {
  const typeLabel = commercialDocumentLabels[document.type] || "Document";
  return {
    id: document._id,
    typeLabel,
    number: document.invoiceNumber || "Sans numéro",
    client: getCommercialDocumentClient(document),
    dateLabel: new Date(document.updatedAt || document.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
    statusLabel: document.type === "invoice" ? (document.paymentStatus === "paid" ? "Facture réglée" : "Paiement en attente") : typeLabel,
    amountLabel: formatCurrency(document.totalTTC)
  };
}

function updateRecentActivity(documents) {
  const list = document.getElementById("dashboardRecentActivityList");
  if (!list) return;

  const recent = getRecentCommercialDocuments(documents);

  if (!recent.length) {
    list.innerHTML = '<p class="empty-state">Aucune activité commerciale pour le moment.</p>';
    return;
  }

  list.innerHTML = recent.map(document => {
    const item = getRecentActivityPresentation(document);
    return `<button type="button" class="dashboard-activity-row" onclick="openInvoice('${item.id}')">
      <span class="dashboard-activity-type">${item.typeLabel}</span>
      <span class="dashboard-activity-main"><strong>${escapeHtml(item.number)}</strong><small>${escapeHtml(item.client)} · ${item.dateLabel}</small></span>
      <span class="dashboard-activity-status">${item.statusLabel}</span>
      <strong class="dashboard-activity-amount">${item.amountLabel}</strong>
    </button>`;
  }).join("");
}

function getMonthlyRevenueInsight(paidInvoices, now = new Date()) {
  const getInvoicesForMonth = (year, month) => paidInvoices.filter(invoice => {
    const date = new Date(invoice.paidAt || invoice.updatedAt || invoice.createdAt);
    return date.getFullYear() === year && date.getMonth() === month;
  });
  const monthPaidInvoices = getInvoicesForMonth(now.getFullYear(), now.getMonth());
  const monthlyRevenue = monthPaidInvoices.reduce(
    (total, invoice) => total + Number(invoice.totalTTC || 0),
    0
  );
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousRevenue = getInvoicesForMonth(previousMonth.getFullYear(), previousMonth.getMonth())
    .reduce((total, invoice) => total + Number(invoice.totalTTC || 0), 0);
  return { monthlyRevenue, invoiceCount: monthPaidInvoices.length, previousRevenue };
}

function getRevenueComparison(monthlyRevenue, previousRevenue) {
  if (!previousRevenue) {
    return {
      text: monthlyRevenue ? "Premier encaissement comparé au mois précédent." : "Pas de comparaison disponible.",
      className: "revenue-comparison neutral"
    };
  }
  const variation = ((monthlyRevenue - previousRevenue) / previousRevenue) * 100;
  return {
    text: `${variation >= 0 ? "+" : ""}${variation.toFixed(0)} % vs le mois précédent`,
    className: `revenue-comparison ${variation >= 0 ? "positive" : "negative"}`
  };
}

function getBestSellers(documents) {
  const sales = new Map();
  documents
    .filter(document => document.type === "order")
    .forEach(order => {
      (order.products || []).forEach(line => {
        const name = line.productName || line.name || line.product?.name || line.productId?.name || "Produit non renseigne";
        sales.set(name, (sales.get(name) || 0) + Number(line.quantity || 0));
      });
    });
  return [...sales.entries()]
    .sort(([, left], [, right]) => right - left)
    .slice(0, 3);
}

function updateCommercialInsights(documents, paidInvoices) {
  const { monthlyRevenue, invoiceCount, previousRevenue } = getMonthlyRevenueInsight(paidInvoices);
  const revenue = document.getElementById("dashboardMonthlyRevenue");
  const revenueDetail = document.getElementById("dashboardMonthlyRevenueDetail");
  if (revenue) revenue.textContent = formatCurrency(monthlyRevenue);
  if (revenueDetail) revenueDetail.textContent = invoiceCount
    ? `${invoiceCount} facture${invoiceCount > 1 ? "s" : ""} réglée${invoiceCount > 1 ? "s" : ""} ce mois-ci.`
    : "Aucune facture réglée ce mois-ci.";
  const comparison = document.getElementById("dashboardRevenueComparison");
  if (comparison) {
    const revenueComparison = getRevenueComparison(monthlyRevenue, previousRevenue);
    comparison.textContent = revenueComparison.text;
    comparison.className = revenueComparison.className;
  }
  dashboardPaidInvoices = paidInvoices;
  refreshDashboardPerformance();

  const bestSellers = getBestSellers(documents);
  const container = document.getElementById("dashboardBestSellers");
  if (!container) return;
  container.innerHTML = bestSellers.length
    ? bestSellers.map(([name, quantity], index) => `
        <div class="best-seller-row">
          <span class="best-seller-rank">${index + 1}</span>
          <strong>${escapeHtml(name)}</strong>
          <span>${quantity} unité${quantity > 1 ? "s" : ""}</span>
        </div>
      `).join("")
    : '<p class="empty-state">Pas encore de vente enregistrée.</p>';
}
