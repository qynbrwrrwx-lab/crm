const Company = require("../../models/companyModel");
const Invoice = require("../../models/invoice");

const TRANSMISSION_STATUSES = ["ready", "queued", "sent", "delivered", "rejected", "error"];
const COMPANY_IDENTITY_FIELDS = [
  ["Raison sociale", "companyName"],
  ["SIRET", "siret"],
  ["Numéro de TVA", "vatNumber"],
  ["Adresse", "address"],
  ["Code postal", "postalCode"],
  ["Ville", "city"]
];

function getMissingIdentityFields(company) {
  return COMPANY_IDENTITY_FIELDS
    .filter(([, field]) => !String(company?.[field] || "").trim())
    .map(([label]) => label);
}

/**
 * Retourne l'état de préparation. Cette API ne transmet aucune facture à une
 * plateforme : cette responsabilité appartiendra à un connecteur serveur agréé.
 */
async function getElectronicInvoicingStatus(req, res) {
  try {
    const company = await Company.findOne({ userId: req.userId }).lean();
    const profile = company?.electronicInvoicing || {};
    const missingFields = getMissingIdentityFields(company);
    const preparedDocuments = await Invoice.countDocuments({
      userId: req.userId,
      "electronicTransmission.status": { $in: TRANSMISSION_STATUSES }
    });

    return res.json({
      enabled: profile.enabled === true,
      connectionStatus: profile.connectionStatus || "not_configured",
      providerName: profile.providerName || "",
      preferredFormat: profile.preferredFormat || "factur-x",
      identityComplete: missingFields.length === 0,
      missingFields,
      preparedDocuments,
      connectorAvailable: false
    });
  } catch (error) {
    console.error("Erreur statut facturation électronique :", error);
    return res.status(500).json({ error: "Impossible de charger le statut de facturation électronique" });
  }
}

module.exports = { getElectronicInvoicingStatus };
