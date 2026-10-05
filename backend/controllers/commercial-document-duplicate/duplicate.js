const Invoice = require("../../models/invoice");
const { recordAuditEvent } = require("../../services/auditService");
const { getDocumentCompany } = require("../../services/documentCompanyConfigurationService");
const { nextDocumentNumber } = require("../../services/documentNumberService");

async function duplicateQuote(req, res) {
  try {
    const company = await getDocumentCompany(req.userId);
    if (!company) {
      return res.status(400).json({ error: "Complétez les informations de votre entreprise avant de créer un document" });
    }

    const sourceQuote = await Invoice.findOne({ _id: req.params.id, userId: req.userId, type: "quote" });
    if (!sourceQuote) return res.status(404).json({ error: "Devis introuvable" });

    const invoiceNumber = await nextDocumentNumber(req.userId, "quote");
    const duplicate = await Invoice.create({
      invoiceNumber,
      userId: req.userId,
      type: "quote",
      status: "draft",
      contactId: sourceQuote.contactId,
      products: sourceQuote.products.map(line => ({
        productId: line.productId,
        quantity: Number(line.quantity || 0),
        productName: line.productName,
        unitHT: Number(line.unitHT || 0),
        unitTTC: Number(line.unitTTC || 0),
        tva: Number(line.tva || 0),
        lineHT: Number(line.lineHT || 0),
        lineTTC: Number(line.lineTTC || 0),
        discount: Number(line.discount || 0)
      })),
      totalHT: Number(sourceQuote.totalHT || 0),
      totalTTC: Number(sourceQuote.totalTTC || 0),
      paymentMethod: sourceQuote.paymentMethod || "",
      paymentTerms: company.deliveryTerms || sourceQuote.paymentTerms || "Paiement à 30 jours",
      paymentDueDays: Number(company.paymentDueDays ?? sourceQuote.paymentDueDays ?? 30),
      quoteValidityDays: Number(company.quoteValidity || sourceQuote.quoteValidityDays || 30),
      paymentStatus: "pending"
    });
    await recordAuditEvent({
      userId: req.userId,
      action: "quote.duplicated",
      documentId: duplicate._id,
      metadata: { invoiceNumber, sourceQuoteNumber: sourceQuote.invoiceNumber }
    });
    return res.status(201).json(duplicate);
  } catch (error) {
    console.error("Erreur duplication devis :", error);
    if (error.code === 11000) return res.status(409).json({ error: "Un numéro de devis identique existe déjà. Réessayez." });
    return res.status(500).json({ error: "Impossible de dupliquer ce devis" });
  }
}

module.exports = { duplicateQuote };
