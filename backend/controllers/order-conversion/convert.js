const Invoice = require("../../models/invoice");
const Company = require("../../models/companyModel");
const { recordAuditEvent } = require("../../services/auditService");
const { nextDocumentNumber } = require("../../services/documentNumberService");
const { getElectronicTransmissionDraft, getPaymentDueDate } = require("../../services/commercialDocumentService");

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
      const deposits = depositInvoices.map(deposit => {
        const paidTTC = deposit.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const paidHT = Number(deposit.totalTTC || 0) > 0 ? Math.round((paidTTC * Number(deposit.totalHT || 0) / Number(deposit.totalTTC || 0)) * 100) / 100 : 0;
        return { number: deposit.invoiceNumber, paidHT, paidTTC };
      }).filter(deposit => deposit.paidTTC > 0);
      const depositsHT = deposits.reduce((sum, deposit) => sum + deposit.paidHT, 0);
      const depositsTTC = deposits.reduce((sum, deposit) => sum + deposit.paidTTC, 0);
      const finalProducts = order.products.map(item => ({
        productId: item.productId, quantity: item.quantity, discount: item.discount || 0, productName: item.productName,
        unitHT: item.unitHT, unitTTC: item.unitTTC, tva: item.tva, lineHT: item.lineHT, lineTTC: item.lineTTC
      }));
      if (depositsTTC > 0) finalProducts.push({
        productName: `Déduction acompte${deposits.length > 1 ? "s" : ""} ${deposits.map(deposit => deposit.number).join(", ")}`,
        quantity: 1, unitHT: -depositsHT, unitTTC: -depositsTTC, tva: 0, lineHT: -depositsHT, lineTTC: -depositsTTC, discount: 0
      });
      const finalTotalHT = Math.max(0, Math.round((Number(order.totalHT || 0) - depositsHT) * 100) / 100);
      const finalTotalTTC = Math.max(0, Math.round((Number(order.totalTTC || 0) - depositsTTC) * 100) / 100);

      const invoice =
        await Invoice.create({

          invoiceNumber,

          userId: req.userId,

          type: "invoice",

          status: "draft",

          contactId: order.contactId,

          sourceOrderId: order._id,

          products: finalProducts,

          totalHT: finalTotalHT,

          totalTTC: finalTotalTTC,

          paymentMethod: "pending",

          paymentTerms: order.paymentTerms || "",

          paymentDueDays: Number(order.paymentDueDays ?? 30),

          paymentDueDate: getPaymentDueDate(order.paymentDueDays ?? 30),

          quoteValidityDays: order.quoteValidityDays || null,

          paymentStatus: finalTotalTTC === 0 ? "paid" : "pending",

          ...(electronicTransmission ? { electronicTransmission } : {})

        });

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

module.exports = { convertOrderToInvoice };
