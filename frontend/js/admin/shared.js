// admin : shared.

function escapeAdminHtml(value) {
  const node = document.createElement("span");
  node.textContent = String(value || "");
  return node.innerHTML;
}

function adminMoney(value) {
  return `${Number(value || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function subscriptionInvoiceStatus(status) {
  return ({ draft: "Brouillon", sent: "Envoyée", paid: "Payée", cancelled: "Annulée" })[status] || status;
}
