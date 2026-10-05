const Invoice = require("../models/invoice");

async function deleteDraftQuote(req, res) {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.userId });
    if (!invoice) return res.status(404).json({ error: "Document introuvable" });
    if (invoice.type !== "quote" || invoice.status === "accepted") {
      return res.status(409).json({ error: "Seul un devis non accepté peut être supprimé" });
    }

    await invoice.deleteOne();
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur suppression facture" });
  }
}

module.exports = { deleteDraftQuote };
