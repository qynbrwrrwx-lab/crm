// Administration : présentation des factures d'abonnement.

function getSubscriptionInvoiceListPresentation(invoices) {
  return {
    emptyMessage: "Aucune facture d’abonnement pour ce compte.",
    items: invoices.map(invoice => ({
      id: invoice._id,
      number: invoice.invoiceNumber,
      planName: invoice.planName,
      totalLabel: adminMoney(invoice.totalTTC),
      statusLabel: subscriptionInvoiceStatus(invoice.status),
      dueDateLabel: invoice.dueDate ? `Échéance ${new Date(invoice.dueDate).toLocaleDateString("fr-FR")}` : "",
      canSend: invoice.status !== "cancelled",
      canMarkPaid: invoice.status !== "paid" && invoice.status !== "cancelled"
    }))
  };
}

function renderSubscriptionInvoiceRows(invoices) {
  const presentation = getSubscriptionInvoiceListPresentation(invoices);
  if (!presentation.items.length) return `<p>${presentation.emptyMessage}</p>`;
  return presentation.items.map(invoice => `<div class="admin-invoice-row"><div><strong class="admin-invoice-number">${escapeAdminHtml(invoice.number)}</strong><span class="admin-invoice-plan">${escapeAdminHtml(invoice.planName)} · ${invoice.totalLabel}</span><small class="admin-invoice-status">${invoice.statusLabel}${invoice.dueDateLabel ? ` · ${invoice.dueDateLabel}` : ""}</small></div><div class="admin-invoice-actions"><button class="admin-invoice-action admin-invoice-action--download" onclick="downloadSubscriptionInvoice('${invoice.id}')">PDF</button>${invoice.canSend ? `<button class="admin-invoice-action admin-invoice-action--send" onclick="sendSubscriptionInvoice('${invoice.id}','${escapeAdminHtml(invoice.number)}')">Envoyer</button>` : ""}${invoice.canMarkPaid ? `<button class="admin-invoice-action admin-invoice-action--paid" onclick="setSubscriptionInvoiceStatus('${invoice.id}','paid')">Marquer payée</button>` : ""}</div></div>`).join("");
}
