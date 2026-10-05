const Invoice = require("../../models/invoice");
const { recordAuditEvent } = require("../../services/auditService");

const allowedPaymentMethods = ["Espèces", "Carte bancaire", "Chèque", "Virement bancaire"];

async function recordInvoicePayment(req, res) {
  try {
    const { paymentMethod } = req.body;
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.userId });
    if (!invoice) return res.status(404).json({ error: "Facture introuvable" });
    if (invoice.type !== "invoice") return res.status(400).json({ error: "Ce document n'est pas une facture" });
    if (invoice.paymentStatus === "paid") return res.status(400).json({ error: "Cette facture est déjà payée" });
    if (!paymentMethod) return res.status(400).json({ error: "Le moyen de paiement est obligatoire" });
    if (!allowedPaymentMethods.includes(paymentMethod)) return res.status(400).json({ error: "Moyen de paiement invalide" });

    const alreadyPaid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const remaining = Math.max(0, Number(invoice.totalTTC || 0) - alreadyPaid);
    const amount = Number(req.body.amount ?? remaining);
    if (!Number.isFinite(amount) || amount <= 0 || amount > remaining + 0.001) {
      return res.status(400).json({ error: "Le montant doit être supérieur à zéro et ne peut pas dépasser le reste à régler" });
    }

    const paidAt = new Date();
    const newPaidTotal = Math.round((alreadyPaid + amount) * 100) / 100;
    invoice.paymentStatus = newPaidTotal >= Number(invoice.totalTTC || 0) - 0.001 ? "paid" : "partial";
    invoice.paymentMethod = paymentMethod;
    invoice.paidAt = invoice.paymentStatus === "paid" ? paidAt : null;
    invoice.payments.push({ amount, method: paymentMethod, paidAt });
    await invoice.save();
    await recordAuditEvent({
      userId: req.userId,
      action: "invoice.paid",
      documentId: invoice._id,
      metadata: { invoiceNumber: invoice.invoiceNumber, paymentMethod, amount, paymentStatus: invoice.paymentStatus }
    });
    return res.json(invoice);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur paiement" });
  }
}

module.exports = { recordInvoicePayment };
