// Prépare les libellés et les étapes de la fiche sans accès au DOM ni à l’API.
function buildInvoiceDetailPresentation(invoice) {
  const invoiceDueState = getInvoiceDueState(invoice);
  const electronicTransmission = getElectronicTransmissionPresentation(invoice);
  const { documentTypeLabel, documentStatus, documentInfo, documentTerms, statusClass, nextStep } = getDocumentStatusPresentation(invoice, invoiceDueState);

  const clientName = invoice.contactId?.companyName ||
    `${invoice.contactId?.firstname || ""} ${invoice.contactId?.lastname || ""}`.trim() ||
    "Client non renseigné";

  const getDocumentReferenceId = value => {
    if (!value) return null;
    return String(value._id || value);
  };

  const linkedDocument = invoice.type === "quote" && invoice.convertedToOrderId
    ? { id: getDocumentReferenceId(invoice.convertedToOrderId), label: "Ouvrir la commande liée" }
    : invoice.type === "order" && invoice.convertedToInvoiceId
      ? { id: getDocumentReferenceId(invoice.convertedToInvoiceId), label: "Ouvrir la facture liée" }
      : invoice.type === "invoice" && invoice.sourceOrderId
        ? { id: getDocumentReferenceId(invoice.sourceOrderId), label: "Ouvrir la commande d’origine" }
        : invoice.type === "credit_note" && invoice.sourceDocumentId
          ? { id: getDocumentReferenceId(invoice.sourceDocumentId), label: "Ouvrir la facture d’origine" }
          : null;

  const timelineSteps = getInvoiceTimelineSteps(invoice);

  return { documentTypeLabel, invoiceDueState, electronicTransmission, documentStatus, documentInfo, documentTerms, statusClass, nextStep, clientName, linkedDocument, timelineSteps };
}
