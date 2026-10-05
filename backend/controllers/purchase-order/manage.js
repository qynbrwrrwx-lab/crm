const Company = require("../../models/companyModel");
const Product = require("../../models/product");
const PurchaseOrder = require("../../models/purchaseOrder");
const StockMovement = require("../../models/stockMovement");
const Supplier = require("../../models/supplier");
const User = require("../../models/user");
const { sendEmail } = require("../../services/emailService");

const ORDER_STATUSES = new Set(["draft", "sent", "received", "cancelled"]);

function normalizeLines(lines) {
  if (!Array.isArray(lines)) return [];
  return lines
    .filter(line => line?.productId && line?.name && Number(line.quantity) > 0)
    .map(line => ({
      productId: line.productId,
      name: String(line.name).slice(0, 180),
      reference: String(line.reference || "").slice(0, 80),
      quantity: Number(line.quantity)
    }));
}

async function listPurchaseOrders(req, res) {
  try {
    const orders = await PurchaseOrder.find({ userId: req.userId })
      .populate("supplierId", "name")
      .sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération des bons de commande" });
  }
}

async function createPurchaseOrder(req, res) {
  try {
    const supplier = await Supplier.findOne({ _id: req.body.supplierId, userId: req.userId });
    const lines = normalizeLines(req.body.lines);
    if (!supplier || !lines.length) {
      return res.status(400).json({ error: "Fournisseur ou lignes de commande invalides" });
    }

    const count = await PurchaseOrder.countDocuments({ userId: req.userId });
    const order = await PurchaseOrder.create({
      userId: req.userId,
      supplierId: supplier._id,
      number: `BCF-${String(count + 1).padStart(5, "0")}`,
      lines
    });
    return res.status(201).json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la création du bon de commande" });
  }
}

async function sendPurchaseOrder(req, res) {
  try {
    const order = await PurchaseOrder.findOne({ _id: req.params.id, userId: req.userId }).populate("supplierId");
    if (!order || !order.supplierId?.email) {
      return res.status(400).json({ error: "Bon ou adresse e-mail fournisseur introuvable" });
    }

    const [company, user] = await Promise.all([
      Company.findOne({ userId: req.userId }),
      User.findById(req.userId).select("email")
    ]);
    const sender = String(company?.companyName || "Votre entreprise").replace(/[\r\n]/g, " ").trim();
    const lines = order.lines
      .map(line => `- ${line.name}${line.reference ? ` (${line.reference})` : ""} : ${line.quantity}`)
      .join("\n");
    const sent = await sendEmail({
      to: order.supplierId.email,
      from: process.env.EMAIL_FROM ? `My Prospect — ${sender} <${process.env.EMAIL_FROM}>` : undefined,
      replyTo: company?.replyToEmail || company?.email || user?.email || undefined,
      subject: `Bon de commande ${order.number}`,
      text: `Bonjour,\n\nVeuillez trouver notre bon de commande ${order.number} :\n\n${lines}\n\nCordialement,\n${sender}`
    });
    if (!sent) return res.status(502).json({ error: "L’e-mail n’a pas pu être envoyé" });

    order.status = "sent";
    order.sentAt = new Date();
    await order.save();
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de l'envoi du bon de commande" });
  }
}

async function updatePurchaseOrderStatus(req, res) {
  try {
    const status = req.body.status;
    if (!ORDER_STATUSES.has(status)) return res.status(400).json({ error: "Statut invalide" });

    const order = await PurchaseOrder.findOne({ _id: req.params.id, userId: req.userId });
    if (!order) return res.status(404).json({ error: "Bon de commande introuvable" });
    if (order.stockReceivedAt && status !== "received") {
      return res.status(409).json({ error: "Un bon réceptionné est verrouillé car le stock a déjà été ajouté" });
    }

    if (status === "received" && !order.stockReceivedAt) {
      for (const line of order.lines) {
        const product = await Product.findOneAndUpdate(
          { _id: line.productId, userId: req.userId },
          { $inc: { stock: line.quantity } },
          { new: true }
        );
        if (product) {
          await StockMovement.create({ userId: req.userId, productId: product._id, quantity: line.quantity, type: "restock" });
        }
      }
      order.stockReceivedAt = new Date();
    }

    order.status = status;
    await order.save();
    return res.json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la mise à jour du bon de commande" });
  }
}

module.exports = { createPurchaseOrder, listPurchaseOrders, sendPurchaseOrder, updatePurchaseOrderStatus };
