const Invoice = require("../../models/invoice");
const { recordAuditEvent } = require("../../services/auditService");
const { getElectronicTransmissionDraft, getPaymentDueDate } = require("../../services/commercialDocumentService");
const { getDocumentCompany } = require("../../services/documentCompanyConfigurationService");
const { nextDocumentNumber } = require("../../services/documentNumberService");

async function createDepositInvoice(req, res) {
  try {
    const quote = await Invoice.findOne({ _id: req.params.id, userId: req.userId, type: "quote", status: "accepted" });
    if (!quote) return res.status(400).json({ error: "Seul un devis accepté peut donner lieu à une facture d’acompte" });
    const rate = Number(req.body.rate);
    if (!Number.isFinite(rate) || rate <= 0 || rate > 100) return res.status(400).json({ error: "Le pourcentage d’acompte doit être compris entre 0 et 100" });
    const company = await getDocumentCompany(req.userId);
    if (!company) return res.status(400).json({ error: "Complétez les informations de votre entreprise avant de créer un document" });
    const totalHT = Math.round(Number(quote.totalHT || 0) * rate) / 100;
    const totalTTC = Math.round(Number(quote.totalTTC || 0) * rate) / 100;
    const vatRate = totalHT > 0 ? Math.round(((totalTTC / totalHT) - 1) * 10000) / 100 : 0;
    const invoiceNumber = await nextDocumentNumber(req.userId, "invoice");
    const paymentDueDays = Number(quote.paymentDueDays ?? company.paymentDueDays ?? 30);
    const electronicTransmission = getElectronicTransmissionDraft(company, "invoice");
    const deposit = await Invoice.create({ userId: req.userId, invoiceNumber, type: "invoice", status: "issued", isDepositInvoice: true, depositForQuoteId: quote._id, depositRate: rate, contactId: quote.contactId, products: [{ productName: `Acompte de ${rate}% sur devis ${quote.invoiceNumber}`, quantity: 1, unitHT: totalHT, unitTTC: totalTTC, tva: vatRate, lineHT: totalHT, lineTTC: totalTTC, discount: 0 }], totalHT, totalTTC, paymentTerms: quote.paymentTerms || company.deliveryTerms || "", paymentDueDays, paymentDueDate: getPaymentDueDate(paymentDueDays), paymentStatus: "pending", ...(electronicTransmission ? { electronicTransmission } : {}) });
    await recordAuditEvent({ userId: req.userId, action: "invoice.deposit_created", documentId: deposit._id, metadata: { invoiceNumber: deposit.invoiceNumber, quoteNumber: quote.invoiceNumber, rate } });
    return res.status(201).json(deposit);
  } catch (error) { console.error(error); return res.status(500).json({ error: "Impossible de créer la facture d’acompte" }); }
}
module.exports = { createDepositInvoice };
