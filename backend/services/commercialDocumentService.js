function getPaymentDueDate(days) {
  const dueDate = new Date();
  dueDate.setHours(0, 0, 0, 0);
  dueDate.setDate(dueDate.getDate() + Number(days || 0));
  return dueDate;
}

function getElectronicTransmissionDraft(company, type) {
  const enabled = company?.electronicInvoicing?.enabled === true;
  const coveredDocument = type === "invoice" || type === "credit_note";
  if (!enabled || !coveredDocument) return undefined;

  const providerName = String(company.electronicInvoicing.providerName || "").trim();
  return {
    status: "ready",
    providerKey: String(company.electronicInvoicing.providerKey || ""),
    lastError: providerName
      ? "Connecteur de plateforme agréée en attente d'activation."
      : "Aucune plateforme agréée sélectionnée."
  };
}

module.exports = { getElectronicTransmissionDraft, getPaymentDueDate };
