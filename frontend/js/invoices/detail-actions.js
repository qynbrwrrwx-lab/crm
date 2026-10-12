// Documents commerciaux : groupes d’actions de la fiche de détail.

function renderDocumentPdfAction(invoice) {
  return `<button type="button" class="secondary-btn document-pdf-action" onclick="viewQuote('${invoice._id}')">Aperçu PDF</button>`;
}

function renderLinkedDocumentAction(linkedDocument) {
  return linkedDocument?.id
    ? `<button type="button" class="secondary-btn document-linked-action" onclick="openInvoice('${linkedDocument.id}')">${linkedDocument.label}</button>`
    : "";
}

function renderDocumentEmailAction(invoice) {
  if (!["quote", "order", "invoice", "credit_note"].includes(invoice.type)) return "";
  if (invoice.contactId?.email) {
    return `<button class="secondary-btn" data-document-action="email" data-document-id="${invoice._id}" onclick="sendDocumentEmail('${invoice._id}')">Envoyer par email</button>`;
  }
  return `<button class="secondary-btn document-email-disabled" type="button" disabled title="Ajoutez l’adresse e-mail dans la fiche du client">Adresse e-mail manquante</button>${invoice.contactId?._id ? `<button class="secondary-btn document-contact-fix-action" type="button" onclick="editContactFromDocument('${invoice.contactId._id}')">Compléter le client</button>` : ""}`;
}

function renderQuoteDetailActions(invoice, isEditingQuote) {
  if (invoice.type !== "quote") return "";
  const isAccepted = invoice.status === "accepted";
  const quoteAcceptance = !isAccepted
    ? `<button class="primary-btn" data-document-action="accept" data-document-id="${invoice._id}" onclick="acceptQuote('${invoice._id}')">Accepter le devis</button>`
    : "";
  const duplicate = `<button type="button" class="secondary-btn" data-document-action="duplicate-quote" data-document-id="${invoice._id}" onclick="duplicateQuote('${invoice._id}')">Dupliquer</button>`;
  const deposit = isAccepted ? `<button class="secondary-btn" onclick="createDepositInvoice('${invoice._id}')">Créer une facture d’acompte</button>` : "";
  const conversion = isAccepted && !invoice.convertedToOrderId
    ? `<button class="primary-btn" data-document-action="quote-to-order" data-document-id="${invoice._id}" onclick="convertQuoteToOrder('${invoice._id}')">Transformer en commande</button>`
    : "";
  const editing = !isAccepted
    ? `<button id="editInvoiceBtn" class="primary-btn" onclick="${isEditingQuote ? "saveInvoiceEdition()" : "enableInvoiceEdition()"}">${isEditingQuote ? "Enregistrer" : "Modifier"}</button><details class="document-more-actions"><summary>Plus d’actions</summary><div class="document-more-actions-menu"><button type="button" onclick="deleteInvoice('${invoice._id}')">Supprimer ce devis</button></div></details>`
    : "";
  return [quoteAcceptance, duplicate, deposit, conversion, editing].join("");
}

function renderOrderDetailActions(invoice) {
  if (invoice.type !== "order") return "";
  const delivery = `<button class="secondary-btn" onclick="openDeliveryNote('${invoice._id}')">Bon de livraison</button><button class="secondary-btn" onclick="sendDeliveryNote('${invoice._id}')">Envoyer le bon</button>`;
  const nextStep = getOrderFulfillmentNextStepPresentation(invoice.fulfillmentStatus);
  const fulfillment = nextStep
    ? `<button class="secondary-btn" onclick="updateOrderFulfillment('${invoice._id}','${nextStep.status}')">${nextStep.label}</button>`
    : "";
  const conversion = !invoice.convertedToInvoiceId
    ? `<button class="primary-btn" data-document-action="order-to-invoice" data-document-id="${invoice._id}" onclick="convertOrderToInvoice('${invoice._id}')">Transformer en facture</button>`
    : "";
  return [delivery, fulfillment, conversion].join("");
}

function getOrderFulfillmentNextStepPresentation(status) {
  if (status === "to_prepare") return { status: "prepared", label: "Marquer préparée" };
  if (status === "prepared") return { status: "shipped", label: "Marquer expédiée" };
  if (status === "delivered") return null;
  return { status: "delivered", label: "Marquer livrée" };
}

function renderInvoicePaymentActions(invoice) {
  if (invoice.type !== "invoice") return "";
  const payment = invoice.paymentStatus !== "paid"
    ? `<button class="primary-btn" onclick="markInvoicePaid('${invoice._id}')">Marquer comme payée</button>`
    : `<span class="invoice-paid-badge">Payée${invoice.paymentMethod ? ` · ${escapeHtml(invoice.paymentMethod)}` : ""}</span>`;
  const creditNote = !invoice.creditNoteId
    ? `<button class="secondary-btn" data-document-action="credit-note" data-document-id="${invoice._id}" onclick="createCreditNote('${invoice._id}')">Créer un avoir</button>`
    : "";
  const reminder = getInvoiceDueState(invoice)?.kind === "overdue" && invoice.contactId?.email
    ? `<button class="secondary-btn document-contact-fix-action" onclick="openPaymentReminder('${invoice._id}')">${invoice.paymentReminderSentAt ? `Renvoyer la relance · ${formatDocumentEmailDate(invoice.paymentReminderSentAt)}` : "Envoyer une relance"}</button>`
    : "";
  return [payment, creditNote, reminder].join("");
}

function renderInvoiceDetailActions(invoice, isEditingQuote, linkedDocument) {
  const actions = [
    renderDocumentPdfAction(invoice),
    renderLinkedDocumentAction(linkedDocument),
    renderDocumentEmailAction(invoice),
    renderQuoteDetailActions(invoice, isEditingQuote),
    renderOrderDetailActions(invoice),
    renderInvoicePaymentActions(invoice)
  ].join("");
  return `<div class="invoice-detail-actions">${actions}</div>`;
}
