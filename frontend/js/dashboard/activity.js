// Tableau de bord : activity.

function updateRecentActivity(documents) {
  const list = document.getElementById("dashboardRecentActivityList");
  if (!list) return;

  const labels = { quote: "Devis", order: "Commande", invoice: "Facture", credit_note: "Avoir" };
  const recent = [...documents]
    .sort((left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt))
    .slice(0, 6);

  if (!recent.length) {
    list.innerHTML = '<p class="empty-state">Aucune activité commerciale pour le moment.</p>';
    return;
  }

  list.innerHTML = recent.map(document => {
    const client = document.contactId?.companyName || `${document.contactId?.firstname || ""} ${document.contactId?.lastname || ""}`.trim() || "Client non renseigné";
    const date = new Date(document.updatedAt || document.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    const detail = document.type === "invoice"
      ? (document.paymentStatus === "paid" ? "Facture réglée" : "Paiement en attente")
      : labels[document.type] || "Document";
    return `<button type="button" class="dashboard-activity-row" onclick="openInvoice('${document._id}')">
      <span class="dashboard-activity-type">${labels[document.type] || "Document"}</span>
      <span class="dashboard-activity-main"><strong>${escapeHtml(document.invoiceNumber || "Sans numéro")}</strong><small>${escapeHtml(client)} · ${date}</small></span>
      <span class="dashboard-activity-status">${detail}</span>
      <strong class="dashboard-activity-amount">${formatCurrency(document.totalTTC)}</strong>
    </button>`;
  }).join("");
}

function updateCommercialInsights(documents, paidInvoices) {
  const now = new Date();
  const monthPaidInvoices = paidInvoices.filter(invoice => {
    const date = new Date(invoice.paidAt || invoice.updatedAt || invoice.createdAt);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  const monthlyRevenue = monthPaidInvoices.reduce(
    (total, invoice) => total + Number(invoice.totalTTC || 0),
    0
  );
  const revenue = document.getElementById("dashboardMonthlyRevenue");
  const revenueDetail = document.getElementById("dashboardMonthlyRevenueDetail");
  if (revenue) revenue.textContent = formatCurrency(monthlyRevenue);
  if (revenueDetail) {
    revenueDetail.textContent = monthPaidInvoices.length
      ? `${monthPaidInvoices.length} facture${monthPaidInvoices.length > 1 ? "s" : ""} réglée${monthPaidInvoices.length > 1 ? "s" : ""} ce mois-ci.`
      : "Aucune facture réglée ce mois-ci.";
  }
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousRevenue = paidInvoices
    .filter(invoice => {
      const date = new Date(invoice.paidAt || invoice.updatedAt || invoice.createdAt);
      return date.getFullYear() === previousMonth.getFullYear() && date.getMonth() === previousMonth.getMonth();
    })
    .reduce((total, invoice) => total + Number(invoice.totalTTC || 0), 0);
  const comparison = document.getElementById("dashboardRevenueComparison");
  if (comparison) {
    if (!previousRevenue) {
      comparison.textContent = monthlyRevenue ? "Premier encaissement comparé au mois précédent." : "Pas de comparaison disponible.";
      comparison.className = "revenue-comparison neutral";
    } else {
      const variation = ((monthlyRevenue - previousRevenue) / previousRevenue) * 100;
      comparison.textContent = `${variation >= 0 ? "+" : ""}${variation.toFixed(0)} % vs le mois précédent`;
      comparison.className = `revenue-comparison ${variation >= 0 ? "positive" : "negative"}`;
    }
  }
  dashboardPaidInvoices = paidInvoices;
  refreshDashboardPerformance();

  const sales = new Map();
  documents
    .filter(document => document.type === "order")
    .forEach(order => {
      (order.products || []).forEach(line => {
        const name = line.productName || line.name || line.product?.name || line.productId?.name || "Produit non renseigne";
        sales.set(name, (sales.get(name) || 0) + Number(line.quantity || 0));
      });
    });

  const bestSellers = [...sales.entries()]
    .sort(([, left], [, right]) => right - left)
    .slice(0, 3);
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
