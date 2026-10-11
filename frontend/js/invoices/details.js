// Documents commerciaux : details. Voir README.md pour les responsabilités.

const documentActivityLabels = {
  "document.created": "Document créé",
  "quote.accepted": "Devis accepté",
  "document.converted_to_order": "Commande créée depuis le devis",
  "document.converted_to_invoice": "Facture créée depuis la commande",
  "document.email_sent": "Document envoyé par e-mail",
  "document.email_failed": "Échec de l’envoi par e-mail",
  "invoice.paid": "Paiement enregistré",
  "invoice.credit_note_created": "Avoir créé"
};

function getDocumentActivityPresentation(event) {
  return {
    label: documentActivityLabels[event.action] || event.action,
    dateLabel: new Date(event.createdAt).toLocaleString("fr-FR")
  };
}

async function copyDocumentNumber(value) {
  const number = String(value || "").trim();
  if (!number) return;

  try {
    await navigator.clipboard.writeText(number);
  } catch (err) {
    const input = document.createElement("textarea");
    input.value = number;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }

  showToast(`Numéro ${number} copié`);
}

async function loadDocumentActivity(documentId) {
  const container = document.getElementById("documentActivity");
  if (!container) return;

  try {
    const events = await apiFetch(`/api/invoices/${documentId}/activity`);

    container.innerHTML = events.length
      ? events.map(event => {
        const presentation = getDocumentActivityPresentation(event);
        return `
          <div class="document-activity-row">
            <span class="document-activity-dot"></span>
            <div><strong>${escapeHtml(presentation.label)}</strong><small>${presentation.dateLabel}</small></div>
          </div>
        `;
      }).join("")
      : '<p class="document-activity-empty">Aucun événement supplémentaire pour ce document.</p>';
  } catch (err) {
    container.innerHTML = '<p class="document-activity-empty">Historique indisponible pour le moment.</p>';
  }
}

async function openInvoice(id) {
  currentInvoiceId = id;
  const invoices = await apiFetch("/api/invoices");
  const invoice = invoices.find(item => item._id === id);
  if (!invoice) return;

  currentInvoice = structuredClone(invoice);
  recalculateInvoice();

  const presentation = buildInvoiceDetailPresentation(invoice);
  document.getElementById("invoiceDetailsModal").style.display = "flex";
  document.getElementById("detailNumber").innerText = invoice.invoiceNumber;
  document.getElementById("detailDocumentType").innerText = presentation.documentTypeLabel;
  document.getElementById("invoiceDetailsBody").innerHTML =
    renderInvoiceDetailBody(invoice, currentInvoice, isEditingQuote, presentation);

  loadDocumentActivity(invoice._id);
}

function closeInvoiceDetails() {
  isEditingQuote = false;
  currentInvoiceId = null;
  document.getElementById("invoiceDetailsModal").style.display = "none";
}
