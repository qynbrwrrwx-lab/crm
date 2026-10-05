const Invoice = require("../../models/invoice");
const { recordAuditEvent } = require("../../services/auditService");

async function acceptQuote(req, res) {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.userId });
    if (!invoice) return res.status(404).json({ error: "Devis introuvable" });
    if (invoice.type !== "quote" || invoice.status === "accepted") {
      return res.status(409).json({ error: "Seul un devis en attente peut être accepté" });
    }
    invoice.status = "accepted";
    await invoice.save();
    await recordAuditEvent({ userId: req.userId, action: "quote.accepted", documentId: invoice._id, metadata: { invoiceNumber: invoice.invoiceNumber } });
    return res.json(invoice);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur validation devis" });
  }
}

module.exports = { acceptQuote };
