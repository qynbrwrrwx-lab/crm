const Company = require("../../models/companyModel");
const Invoice = require("../../models/invoice");
const { recordAuditEvent } = require("../../services/auditService");
const { getElectronicTransmissionDraft } = require("../../services/commercialDocumentService");
const { nextDocumentNumber } = require("../../services/documentNumberService");

async function createCreditNote(req, res) {
  try {
    const sourceInvoice = await Invoice.findOne({ _id: req.params.id, userId: req.userId, type: "invoice" });
    if (!sourceInvoice) return res.status(404).json({ error: "Facture introuvable" });
    if (sourceInvoice.creditNoteId) return res.status(409).json({ error: "Un avoir existe déjà pour cette facture" });

    const invoiceNumber = await nextDocumentNumber(req.userId, "credit_note");
    const company = await Company.findOne({ userId: req.userId });
    const electronicTransmission = getElectronicTransmissionDraft(company, "credit_note");
    const creditNote = await Invoice.create({ invoiceNumber, userId: req.userId, type: "credit_note", status: "issued", sourceDocumentId: sourceInvoice._id, contactId: sourceInvoice.contactId, products: sourceInvoice.products, totalHT: -Math.abs(Number(sourceInvoice.totalHT || 0)), totalTTC: -Math.abs(Number(sourceInvoice.totalTTC || 0)), paymentTerms: sourceInvoice.paymentTerms || "", quoteValidityDays: sourceInvoice.quoteValidityDays || null, paymentStatus: "pending", ...(electronicTransmission ? { electronicTransmission } : {}) });
    sourceInvoice.creditNoteId = creditNote._id;
    await sourceInvoice.save();
    await recordAuditEvent({ userId: req.userId, action: "invoice.credit_note_created", documentId: creditNote._id, metadata: { invoiceNumber, sourceInvoiceNumber: sourceInvoice.invoiceNumber } });
    return res.status(201).json(creditNote);
  } catch (error) {
    console.error(error);
    if (error.code === 11000 && error.keyPattern?.sourceDocumentId) return res.status(409).json({ error: "Un avoir existe deja pour cette facture" });
    if (error.code === 11000) return res.status(409).json({ error: "Numéro d'avoir déjà utilisé. Réessayez." });
    return res.status(500).json({ error: "Impossible de créer l'avoir" });
  }
}
module.exports = { createCreditNote };
