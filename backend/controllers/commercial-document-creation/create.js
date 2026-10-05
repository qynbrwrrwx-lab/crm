const Contact = require("../../models/contact");
const Invoice = require("../../models/invoice");
const Product = require("../../models/product");
const { recordAuditEvent } = require("../../services/auditService");
const { getElectronicTransmissionDraft, getPaymentDueDate } = require("../../services/commercialDocumentService");
const { getDocumentCompany } = require("../../services/documentCompanyConfigurationService");
const { nextDocumentNumber } = require("../../services/documentNumberService");

async function createCommercialDocument(req, res) {
  try {
    const company = await getDocumentCompany(req.userId);
    if (!company) {
      return res.status(400).json({ error: "Complétez les informations de votre entreprise avant de créer un document" });
    }

    const { type, contactId, paymentMethod, products } = req.body;
    const contact = await Contact.findOne({ _id: contactId, userId: req.userId });
    if (!contact) return res.status(404).json({ error: "Contact introuvable" });

    let totalHT = 0;
    let totalTTC = 0;
    const populatedProducts = [];
    for (const item of products) {
      const product = await Product.findOne({ _id: item.productId, userId: req.userId });
      if (!product) return res.status(404).json({ error: "Produit introuvable" });

      const discount = Number(item.discount || 0);
      const lineHT = Number(product.priceHT) * Number(item.quantity) * (1 - discount / 100);
      const lineTTC = lineHT * (1 + Number(product.tva || 20) / 100);
      totalHT += lineHT;
      totalTTC += lineTTC;
      populatedProducts.push({
        productId: product._id,
        quantity: item.quantity,
        discount: item.discount || 0,
        productName: product.name,
        unitHT: Number(product.priceHT),
        unitTTC: Number(product.priceHT) * (1 + Number(product.tva || 20) / 100),
        tva: Number(product.tva || 20),
        lineHT,
        lineTTC
      });
    }

    const invoiceNumber = await nextDocumentNumber(req.userId, type);
    const electronicTransmission = getElectronicTransmissionDraft(company, type);
    const invoice = await Invoice.create({
      invoiceNumber,
      userId: req.userId,
      type,
      contactId,
      products: populatedProducts,
      totalHT,
      totalTTC,
      paymentMethod,
      paymentTerms: company.deliveryTerms || "Paiement à 30 jours",
      paymentDueDays: Number(company.paymentDueDays ?? 30),
      paymentDueDate: type === "invoice" ? getPaymentDueDate(company.paymentDueDays ?? 30) : null,
      quoteValidityDays: Number(company.quoteValidity || 30),
      paymentStatus: "pending",
      ...(electronicTransmission ? { electronicTransmission } : {})
    });
    await recordAuditEvent({
      userId: req.userId,
      action: "document.created",
      documentId: invoice._id,
      metadata: { invoiceNumber, type }
    });
    return res.json(invoice);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(409).json({ error: "Un numéro de document identique existe déjà. Réessayez." });
    }
    return res.status(500).json({ error: "Erreur création facture" });
  }
}

module.exports = { createCommercialDocument };
