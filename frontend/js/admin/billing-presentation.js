// Administration : présentation des factures d'abonnement.

function renderSubscriptionInvoiceRows(invoices) {
  if (!invoices.length) return '<p>Aucune facture d’abonnement pour ce compte.</p>';
  return invoices.map(invoice => `
    <div style="display:flex;gap:12px;align-items:center;justify-content:space-between;padding:14px 0;border-top:1px solid rgba(255,255,255,.09);flex-wrap:wrap">
      <div>
        <strong style="color:#e2e8f0">${escapeAdminHtml(invoice.invoiceNumber)}</strong>
        <span style="margin-left:9px;color:#94a3b8">${escapeAdminHtml(invoice.planName)} · ${adminMoney(invoice.totalTTC)}</span>
        <small style="display:block;margin-top:4px;color:#64748b">${subscriptionInvoiceStatus(invoice.status)}${invoice.dueDate ? ` · Échéance ${new Date(invoice.dueDate).toLocaleDateString("fr-FR")}` : ""}</small>
      </div>
      <div style="display:flex;gap:7px">
        <button onclick="downloadSubscriptionInvoice('${invoice._id}')" style="padding:7px 9px;border:1px solid #334155;border-radius:8px;background:#020617;color:#cbd5e1;cursor:pointer">PDF</button>
        ${invoice.status !== "cancelled" ? `<button onclick="sendSubscriptionInvoice('${invoice._id}','${escapeAdminHtml(invoice.invoiceNumber)}')" style="padding:7px 9px;border:0;border-radius:8px;background:#1d4ed8;color:white;cursor:pointer">Envoyer</button>` : ""}
        ${invoice.status !== "paid" && invoice.status !== "cancelled" ? `<button onclick="setSubscriptionInvoiceStatus('${invoice._id}','paid')" style="padding:7px 9px;border:0;border-radius:8px;background:#166534;color:white;cursor:pointer">Marquer payée</button>` : ""}
      </div>
    </div>`).join("");
}
