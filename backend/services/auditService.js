const AuditLog = require("../models/auditLog");

async function recordAuditEvent({ userId, action, documentId = null, metadata = {} }) {
  try {
    await AuditLog.create({ userId, action, documentId, metadata });
  } catch (err) {
    console.error("Erreur de journalisation métier :", err.message);
  }
}

module.exports = { recordAuditEvent };
