// Documents commerciaux : shared. Voir README.md pour les responsabilités.

function setDocumentActionPending(id, action, pending, pendingLabel) {
  document.querySelectorAll("[data-document-action]").forEach(button => {
    if (button.dataset.documentId !== String(id) || button.dataset.documentAction !== action) return;
    if (pending) {
      button.dataset.actionLabel = button.textContent.trim();
      button.disabled = true;
      button.classList.add("is-loading");
      button.textContent = pendingLabel;
    } else {
      button.disabled = false;
      button.classList.remove("is-loading");
      button.textContent = button.dataset.actionLabel || button.textContent;
    }
  });
}

function formatDocumentCurrency(value) {
  return formatCurrency(value);
}

function formatDocumentNumber(value) {
  return formatNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function getPaymentMethodLabel(method) {
  const value = String(method || "").trim();
  return !value || ["pending", "paid", "null", "undefined"].includes(value.toLowerCase())
    ? "Paiement enregistré"
    : value;
}

function formatDocumentEmailDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getInvoiceDueState(invoice) {
  if (invoice?.type !== "invoice" || invoice.paymentStatus === "paid" || !invoice.paymentDueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(invoice.paymentDueDate);
  dueDate.setHours(0, 0, 0, 0);
  const days = Math.round((dueDate - today) / 86_400_000);
  if (days < 0) return { kind: "overdue", label: `En retard de ${Math.abs(days)} j` };
  if (days === 0) return { kind: "due-today", label: "Échéance aujourd’hui" };
  if (days <= 7) return { kind: "due-soon", label: `Échéance dans ${days} j` };
  return null;
}

function getElectronicTransmissionPresentation(invoice) {
  const status = invoice?.electronicTransmission?.status;
  const presentations = {
    ready: { label: "Prête pour facturation électronique", className: "ready" },
    queued: { label: "Transmission programmée", className: "queued" },
    sent: { label: "Transmise à la plateforme", className: "sent" },
    delivered: { label: "Facture électronique reçue", className: "delivered" },
    rejected: { label: "Transmission rejetée", className: "rejected" },
    error: { label: "Erreur de transmission", className: "error" }
  };
  return presentations[status] || null;
}

function orderFulfillmentLabel(invoice) {
  return ({ to_prepare: "À préparer", prepared: "Préparée", shipped: "Expédiée", delivered: "Livrée" })[invoice.fulfillmentStatus] || "À préparer";
}
