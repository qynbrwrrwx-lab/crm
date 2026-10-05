const Invoice = require("../../models/invoice");
const { recordAuditEvent } = require("../../services/auditService");

const fulfillmentStatuses = ["to_prepare", "prepared", "shipped", "delivered"];

async function updateOrderFulfillmentStatus(req, res) {
  try {
    const status = String(req.body.status || "");
    if (!fulfillmentStatuses.includes(status)) return res.status(400).json({ error: "Statut de commande invalide" });
    const order = await Invoice.findOne({ _id: req.params.id, userId: req.userId, type: "order" });
    if (!order) return res.status(404).json({ error: "Commande introuvable" });
    const now = new Date();
    order.fulfillmentStatus = status;
    if (status === "prepared" && !order.preparedAt) order.preparedAt = now;
    if (status === "shipped") { order.preparedAt ||= now; order.shippedAt ||= now; }
    if (status === "delivered") { order.preparedAt ||= now; order.shippedAt ||= now; order.deliveredAt ||= now; }
    await order.save();
    await recordAuditEvent({ userId: req.userId, action: "order.fulfillment_updated", documentId: order._id, metadata: { invoiceNumber: order.invoiceNumber, status } });
    return res.json(order);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible de mettre à jour la commande" });
  }
}

module.exports = { updateOrderFulfillmentStatus };
