const Invoice = require("../../models/invoice");
const Product = require("../../models/product");
const StockMovement = require("../../models/stockMovement");
const { recordAuditEvent } = require("../../services/auditService");
const { nextDocumentNumber } = require("../../services/documentNumberService");

function getQuoteConversionError(quote) {
  if (!quote) return { status: 404, error: "Devis introuvable" };
  if (quote.type !== "quote") return { status: 400, error: "Ce document n'est pas un devis" };
  if (quote.status !== "accepted") return { status: 400, error: "Le devis doit être accepté avant de pouvoir être transformé en commande" };
  if (quote.convertedToOrderId) return { status: 400, error: "Ce devis a déjà été transformé en commande" };
  return null;
}

function buildOrderData(quote, userId, invoiceNumber) {
  return {
    invoiceNumber,
    userId,
    type: "order",
    status: "draft",
    contactId: quote.contactId,
    sourceQuoteId: quote._id,
    products: quote.products.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      discount: item.discount || 0,
      productName: item.productName,
      unitHT: item.unitHT,
      unitTTC: item.unitTTC,
      tva: item.tva,
      lineHT: item.lineHT,
      lineTTC: item.lineTTC
    })),
    totalHT: quote.totalHT,
    totalTTC: quote.totalTTC,
    paymentMethod: "pending",
    paymentTerms: quote.paymentTerms || "",
    paymentDueDays: Number(quote.paymentDueDays ?? 30),
    quoteValidityDays: quote.quoteValidityDays || null,
    paymentStatus: "pending"
  };
}

async function convertQuoteToOrder(req, res) {

    try {

      // Récupérer le devis
      const quote =
        await Invoice.findOne({
          _id: req.params.id,
          userId: req.userId
        });

      const conversionError = getQuoteConversionError(quote);
      if (conversionError) return res.status(conversionError.status).json({ error: conversionError.error });

      // ================= STOCK =================

      for (const item of quote.products) {

        const product =
          await Product.findOne({
            _id: item.productId,
            userId: req.userId
          });

        if (!product) {

          return res.status(404).json({
            error: "Produit introuvable"
          });

        }

        if (
          Number(product.stock) <
          Number(item.quantity)
        ) {

          return res.status(400).json({
            error:
              `Stock insuffisant pour le produit ${product.name}`
          });

        }

      }

      // ================= NUMÉRO COMMANDE =================

      const orderNumber = await nextDocumentNumber(req.userId, "order");

      // ================= CRÉATION COMMANDE =================

      const order = await Invoice.create(buildOrderData(quote, req.userId, orderNumber));

      // ================= MISE À JOUR STOCK =================

      const decrementedProducts = [];

      for (const item of quote.products) {

        const quantity = Number(item.quantity);

        const product = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            userId: req.userId,
            stock: { $gte: quantity }
          },
          { $inc: { stock: -quantity } },
          { new: true }
        );

        if (!product) {
          await Promise.all(
            decrementedProducts.map(({ productId, quantity: restoredQuantity }) =>
              Product.updateOne(
                { _id: productId, userId: req.userId },
                { $inc: { stock: restoredQuantity } }
              )
            )
          );

          await StockMovement.deleteMany({ documentId: order._id });

          await order.deleteOne();

          return res.status(409).json({
            error: "Stock insuffisant : la commande n'a pas été créée"
          });
        }

        decrementedProducts.push({
          productId: item.productId,
          quantity
        });

        await StockMovement.create({
          userId: req.userId,
          productId: item.productId,
          quantity: -quantity,
          type: "sale",
          documentId: order._id
        });

      }

      // ================= LIEN DEPUIS LE DEVIS =================

      quote.convertedToOrderId =
        order._id;

      await quote.save();

      await recordAuditEvent({
        userId: req.userId,
        action: "document.converted_to_order",
        documentId: order._id,
        metadata: {
          orderNumber: order.invoiceNumber,
          sourceQuoteNumber: quote.invoiceNumber
        }
      });

      res.json(order);

    } catch (err) {

      console.error(err);

      if (err.code === 11000) {
        return res.status(409).json({
          error: "Ce devis a deja ete transforme en commande"
        });
      }

      res.status(500).json({
        error: "Erreur transformation du devis en commande"
      });

    }

}

module.exports = { convertQuoteToOrder, getQuoteConversionError, buildOrderData };
