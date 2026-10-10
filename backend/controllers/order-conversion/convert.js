const Invoice = require("../../models/invoice");
const Company = require("../../models/companyModel");
const { recordAuditEvent } = require("../../services/auditService");
const { nextDocumentNumber } = require("../../services/documentNumberService");
const { getElectronicTransmissionDraft, getPaymentDueDate } = require("../../services/commercialDocumentService");

function roundCurrency(amount) {
  return Math.round(Number(amount || 0) * 100) / 100;
}

function getDepositSummary(depositInvoices) {
  const deposits = depositInvoices.map(deposit => {
    const paidTTC = (deposit.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const paidHT = Number(deposit.totalTTC || 0) > 0
      ? roundCurrency(paidTTC * Number(deposit.totalHT || 0) / Number(deposit.totalTTC || 0))
      : 0;
    return { number: deposit.invoiceNumber, paidHT, paidTTC };
  }).filter(deposit => deposit.paidTTC > 0);
  return {
    deposits,
    depositsHT: deposits.reduce((sum, deposit) => sum + deposit.paidHT, 0),
    depositsTTC: deposits.reduce((sum, deposit) => sum + deposit.paidTTC, 0)
  };
}

function buildInvoiceData({ order, userId, invoiceNumber, paymentDueDate, electronicTransmission, deposits, depositsHT, depositsTTC }) {
  const products = order.products.map(item => ({
    productId: item.productId, quantity: item.quantity, discount: item.discount || 0, productName: item.productName,
    unitHT: item.unitHT, unitTTC: item.unitTTC, tva: item.tva, lineHT: item.lineHT, lineTTC: item.lineTTC
  }));
  if (depositsTTC > 0) products.push({
    productName: `Déduction acompte${deposits.length > 1 ? "s" : ""} ${deposits.map(deposit => deposit.number).join(", ")}`,
    quantity: 1, unitHT: -depositsHT, unitTTC: -depositsTTC, tva: 0, lineHT: -depositsHT, lineTTC: -depositsTTC, discount: 0
  });
  const totalHT = Math.max(0, roundCurrency(Number(order.totalHT || 0) - depositsHT));
  const totalTTC = Math.max(0, roundCurrency(Number(order.totalTTC || 0) - depositsTTC));
  return {
    invoiceNumber, userId, type: "invoice", status: "draft", contactId: order.contactId, sourceOrderId: order._id,
    products, totalHT, totalTTC, paymentMethod: "pending", paymentTerms: order.paymentTerms || "",
    paymentDueDays: Number(order.paymentDueDays ?? 30), paymentDueDate, quoteValidityDays: order.quoteValidityDays || null,
    paymentStatus: totalTTC === 0 ? "paid" : "pending", ...(electronicTransmission ? { electronicTransmission } : {})
  };
}

async function convertOrderToInvoice(req, res) {

    try {

      const order =
        await Invoice.findOne({
          _id: req.params.id,
          userId: req.userId
        });

      if (!order) {

        return res.status(404).json({
          error: "Commande introuvable"
        });

      }

      if (order.type !== "order") {

        return res.status(400).json({
          error: "Ce document n'est pas une commande"
        });

      }

      // Vérifier si la commande a déjà été facturée

if (order.convertedToInvoiceId) {

  return res.status(400).json({
    error:
      "Cette commande a déjà été transformée en facture"
  });

}

const existingInvoice =
  await Invoice.findOne({
    userId: req.userId,
    type: "invoice",
    sourceOrderId: order._id
  });

if (existingInvoice) {

  // Réparer le lien si nécessaire
  order.convertedToInvoiceId =
    existingInvoice._id;

  await order.save();

  return res.status(400).json({
    error:
      "Cette commande a déjà été transformée en facture"
  });

}

      const invoiceNumber = await nextDocumentNumber(req.userId, "invoice");
      const electronicCompany = await Company.findOne({ userId: req.userId });
      const electronicTransmission = getElectronicTransmissionDraft(electronicCompany, "invoice");
      const depositInvoices = order.sourceQuoteId
        ? await Invoice.find({ userId: req.userId, isDepositInvoice: true, depositForQuoteId: order.sourceQuoteId })
        : [];
      const depositSummary = getDepositSummary(depositInvoices);
      const invoice = await Invoice.create(buildInvoiceData({
        order,
        userId: req.userId,
        invoiceNumber,
        paymentDueDate: getPaymentDueDate(order.paymentDueDays ?? 30),
        electronicTransmission,
        ...depositSummary
      }));

    order.convertedToInvoiceId =
  invoice._id;

await order.save();

      await recordAuditEvent({
        userId: req.userId,
        action: "document.converted_to_invoice",
        documentId: invoice._id,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          sourceOrderNumber: order.invoiceNumber
        }
      });

      res.json(invoice);

    } catch (err) {

      console.error(err);

      if (err.code === 11000) {
        return res.status(409).json({
          error: "Cette commande a deja ete transformee en facture"
        });
      }

      res.status(500).json({
        error:
          "Erreur transformation de la commande en facture"
      });

    }

}

module.exports = { convertOrderToInvoice, getDepositSummary, buildInvoiceData };
