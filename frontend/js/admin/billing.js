// admin : billing.

async function openSubscriptionBilling(userId, email) {
  document.getElementById("adminSummaryModal")?.remove();
  let modal = document.getElementById("adminSubscriptionBillingModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "adminSubscriptionBillingModal";
    modal.style.cssText = "position:fixed;inset:0;z-index:30;overflow:auto;padding:20px;background:rgba(2,6,23,.78);";
    document.body.append(modal);
  }
  modal.dataset.userId = userId;
  modal.innerHTML = renderSubscriptionBillingModal(email);
  document.getElementById("subscriptionInvoiceForm").onsubmit = async event => {
    event.preventDefault();
    try {
      await adminApiFetch(`/api/admin/users/${userId}/subscription-invoices`, { method: "POST", body: JSON.stringify({ planName: document.getElementById("subscriptionPlanName").value, amountHT: document.getElementById("subscriptionAmountHT").value, vatRate: document.getElementById("subscriptionVatRate").value, dueDate: document.getElementById("subscriptionDueDate").value }) });
      document.getElementById("subscriptionInvoiceForm").reset();
      document.getElementById("subscriptionPlanName").value = "Abonnement My Prospect";
      document.getElementById("subscriptionVatRate").value = "20";
      await renderSubscriptionInvoices(userId);
    } catch (error) { alert(error.message); }
  };
  await renderSubscriptionInvoices(userId);
}

async function renderSubscriptionInvoices(userId) {
  const list = document.getElementById("subscriptionInvoiceList");
  if (!list) return;
  try {
    const invoices = await adminApiFetch(`/api/admin/subscription-invoices?userId=${encodeURIComponent(userId)}`);
    list.innerHTML = renderSubscriptionInvoiceRows(invoices);
  } catch (error) { list.textContent = error.message; }
}

async function sendSubscriptionInvoice(id, number) {
  if (!confirm(`Envoyer la facture ${number} par e-mail ?`)) return;
  try {
    await adminApiFetch(`/api/admin/subscription-invoices/${id}/send`, { method: "POST" });
    await renderSubscriptionInvoices(document.getElementById("adminSubscriptionBillingModal")?.dataset.userId);
  } catch (error) { alert(error.message); }
}

async function setSubscriptionInvoiceStatus(id, status) {
  try {
    await adminApiFetch(`/api/admin/subscription-invoices/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    await renderSubscriptionInvoices(document.getElementById("adminSubscriptionBillingModal")?.dataset.userId);
  } catch (error) { alert(error.message); }
}

async function downloadSubscriptionInvoice(id) {
  try {
    const response = await fetch(`${window.location.origin}/api/admin/subscription-invoices/${id}/pdf`, { headers: { Authorization: `Bearer ${adminToken()}` } });
    if (!response.ok) throw new Error("Impossible de télécharger le PDF");
    const url = URL.createObjectURL(await response.blob());
    window.open(url, "_blank", "noopener");
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) { alert(error.message); }
}
