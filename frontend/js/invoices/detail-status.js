// Documents commerciaux : états et actions suggérées.

function getDocumentStatusPresentation(invoice, invoiceDueState) {
  const documentTypeLabel = invoice.isDepositInvoice ? "Facture d’acompte" : {
    quote: "Devis",
    order: "Commande",
    invoice: "Facture",
    credit_note: "Avoir"
  }[invoice.type] || "Document commercial";

  const documentStatus = invoice.type === "invoice"
    ? (invoice.paymentStatus === "paid" ? "Payée" : invoice.paymentStatus === "partial" ? "Partiellement réglée" : invoiceDueState?.kind === "overdue" ? invoiceDueState.label : "En attente de paiement")
    : invoice.type === "quote"
      ? (invoice.status === "accepted" ? "Devis accepté" : invoice.status === "declined" ? "Devis refusé" : "En attente de décision")
      : invoice.type === "order"
        ? orderFulfillmentLabel(invoice)
        : "Avoir émis";

  const documentInfo = invoice.type === "quote"
    ? { label: "État du devis", value: invoice.status === "accepted" ? "Accepté" : invoice.status === "declined" ? "Refusé par le client" : "En attente de décision" }
    : invoice.type === "order"
    ? { label: "Commande", value: `${orderFulfillmentLabel(invoice)}${invoice.convertedToInvoiceId ? " · Facturée" : ""}` }
      : invoice.type === "invoice"
        ? { label: "Paiement", value: invoice.paymentStatus === "paid" ? `Payée${invoice.paymentMethod ? ` · ${invoice.paymentMethod}` : ""}` : invoice.paymentStatus === "partial" ? "Partiellement réglée" : "À encaisser" }
        : { label: "Nature", value: "Document rectificatif" };

  const documentTerms = invoice.type === "quote"
    ? { label: "Validité", value: `${invoice.quoteValidityDays || 30} jours` }
    : invoice.type === "invoice"
      ? { label: "Règlement", value: invoice.paymentTerms || "Selon les paramètres de l’entreprise" }
      : null;

  const statusClass = invoice.type === "invoice" && invoice.paymentStatus === "paid"
    ? "is-success"
    : invoice.type === "invoice" && invoiceDueState?.kind === "overdue"
      ? "is-danger"
    : invoice.type === "quote" && invoice.status === "accepted"
      ? "is-success"
      : invoice.type === "credit_note"
        ? "is-neutral"
        : "is-pending";

  const nextStep = invoice.type === "quote"
      ? (invoice.status === "accepted"
      ? (invoice.convertedToOrderId ? "La commande associée a été créée." : "Transformez ce devis accepté en commande.")
      : invoice.status === "declined"
        ? (invoice.clientDeclineReason ? `Motif du refus : ${invoice.clientDeclineReason}` : "Ce devis a été refusé par le client.")
      : "Envoyez le devis puis enregistrez la décision du client.")
    : invoice.type === "order"
      ? (invoice.convertedToInvoiceId ? "La facture associée a été créée." : "Créez la facture lorsque la commande est prête.")
      : invoice.type === "invoice"
        ? (invoice.paymentStatus === "paid" ? "Le règlement est enregistré, aucune action n’est requise." : "Enregistrez le règlement dès sa réception.")
        : "Cet avoir est lié au document commercial d’origine.";

  return { documentTypeLabel, documentStatus, documentInfo, documentTerms, statusClass, nextStep };
}
