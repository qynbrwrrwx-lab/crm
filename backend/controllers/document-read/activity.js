const AuditLog = require("../../models/auditLog");
const Invoice = require("../../models/invoice");

async function getDocumentActivity(req, res) {
  try {
    const documentExists = await Invoice.exists({ _id: req.params.id, userId: req.userId });
    if (!documentExists) return res.status(404).json({ error: "Document introuvable" });

    const events = await AuditLog.find({ userId: req.userId, documentId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(12)
      .select("action metadata createdAt");

    return res.json(events);
  } catch (error) {
    console.error("Erreur historique document :", error);
    return res.status(500).json({ error: "Impossible de récupérer l'historique du document" });
  }
}

module.exports = { getDocumentActivity };
