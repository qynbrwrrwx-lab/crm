const crypto = require("crypto");

const Company = require("../../models/companyModel");
const Contact = require("../../models/contact");
const Invoice = require("../../models/invoice");
const { recordAuditEvent } = require("../../services/auditService");

function hashAccessToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

async function findAvailableQuote(token) {
  const quote = await Invoice.findOne({
    type: "quote",
    clientAccessTokenHash: hashAccessToken(token),
    clientAccessTokenExpiresAt: { $gt: new Date() }
  }).lean();
  if (!quote) return null;

  const [company, contact] = await Promise.all([
    Company.findOne({ userId: quote.userId }).lean(),
    Contact.findOne({ _id: quote.contactId, userId: quote.userId }).lean()
  ]);
  return { quote, company, contact };
}

async function getPublicQuote(req, res) {
  try {
    const result = await findAvailableQuote(req.params.token);
    if (!result) return res.status(404).json({ error: "Ce lien est invalide ou a expiré." });

    const { quote, company, contact } = result;
    return res.json({
      quote: {
        number: quote.invoiceNumber,
        status: quote.status,
        createdAt: quote.createdAt,
        expiresAt: quote.clientAccessTokenExpiresAt,
        totalHT: quote.totalHT,
        totalTTC: quote.totalTTC,
        products: quote.products.map(item => ({
          name: item.productName || "Produit",
          quantity: item.quantity,
          unitHT: item.unitHT,
          discount: item.discount || 0,
          lineHT: item.lineHT,
          lineTTC: item.lineTTC
        }))
      },
      company: { name: company?.companyName || "Votre entreprise", logo: company?.logo || "", email: company?.email || "", phone: company?.phone || "" },
      client: { name: contact?.companyName || `${contact?.firstname || ""} ${contact?.lastname || ""}`.trim() || "Client" }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible de charger ce devis." });
  }
}

async function acceptPublicQuote(req, res) {
  try {
    const now = new Date();
    const quote = await Invoice.findOneAndUpdate({
      type: "quote",
      status: { $ne: "accepted" },
      clientAccessTokenHash: hashAccessToken(req.params.token),
      clientAccessTokenExpiresAt: { $gt: now }
    }, {
      $set: { status: "accepted", clientAcceptedAt: now },
      $unset: { clientAccessTokenHash: "", clientAccessTokenExpiresAt: "" }
    }, { new: true });
    if (!quote) return res.status(409).json({ error: "Ce devis a déjà été accepté, ou le lien n’est plus disponible." });

    await recordAuditEvent({ userId: quote.userId, action: "quote.accepted_by_client", documentId: quote._id, metadata: { invoiceNumber: quote.invoiceNumber } });
    return res.json({ success: true, number: quote.invoiceNumber });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible d’enregistrer votre acceptation." });
  }
}

async function declinePublicQuote(req, res) {
  try {
    const reason = String(req.body?.reason || "").trim().slice(0, 500);
    const now = new Date();
    const quote = await Invoice.findOneAndUpdate({
      type: "quote",
      status: { $nin: ["accepted", "declined"] },
      clientAccessTokenHash: hashAccessToken(req.params.token),
      clientAccessTokenExpiresAt: { $gt: now }
    }, {
      $set: { status: "declined", clientDeclinedAt: now, clientDeclineReason: reason },
      $unset: { clientAccessTokenHash: "", clientAccessTokenExpiresAt: "" }
    }, { new: true });
    if (!quote) return res.status(409).json({ error: "Ce devis n’est plus disponible pour réponse." });

    await recordAuditEvent({ userId: quote.userId, action: "quote.declined_by_client", documentId: quote._id, metadata: { invoiceNumber: quote.invoiceNumber, reason } });
    return res.json({ success: true, number: quote.invoiceNumber });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible d’enregistrer votre réponse." });
  }
}

module.exports = { acceptPublicQuote, declinePublicQuote, getPublicQuote };
