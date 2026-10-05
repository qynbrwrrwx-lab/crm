const Company = require("../../models/companyModel");

const ELECTRONIC_INVOICE_FORMATS = new Set(["factur-x", "ubl", "cii"]);
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function validateCompanyRequest(body) {
  if (body.replyToEmail && !EMAIL_PATTERN.test(String(body.replyToEmail).trim())) {
    return "L'adresse e-mail de réponse est invalide";
  }
  if (String(body.documentEmailIntro || "").length > 800 || String(body.documentEmailClosing || "").length > 500) {
    return "Le modèle d'e-mail est trop long";
  }
  if (body.deliveryTerms && String(body.deliveryTerms).trim().length > 90) {
    return "Le délai de règlement est trop long";
  }
  if (body.paymentDueDays !== undefined && (!Number.isInteger(Number(body.paymentDueDays)) || Number(body.paymentDueDays) < 0 || Number(body.paymentDueDays) > 365)) {
    return "L'échéance de paiement doit être comprise entre 0 et 365 jours";
  }
  return null;
}

function sanitizeElectronicInvoicing(configuration) {
  if (configuration === undefined) return { value: undefined };
  if (!configuration || typeof configuration !== "object") {
    return { error: "La configuration de facturation électronique est invalide" };
  }
  if (configuration.providerName && String(configuration.providerName).trim().length > 100) {
    return { error: "Le nom de la plateforme est trop long" };
  }
  if (configuration.preferredFormat && !ELECTRONIC_INVOICE_FORMATS.has(configuration.preferredFormat)) {
    return { error: "Le format de facture électronique est invalide" };
  }

  const enabled = configuration.enabled === true;
  const providerName = String(configuration.providerName || "").trim();
  return {
    value: {
      enabled,
      providerName,
      preferredFormat: configuration.preferredFormat || "factur-x",
      // Le navigateur ne peut pas déclarer une plateforme connectée.
      connectionStatus: enabled && providerName ? "pending" : "not_configured"
    }
  };
}

async function getCompany(req, res) {
  try {
    let company = await Company.findOne({ userId: req.userId });
    if (!company) company = await Company.create({ userId: req.userId });
    return res.json(company);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

async function updateCompany(req, res) {
  try {
    const validationError = validateCompanyRequest(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const electronicInvoicing = sanitizeElectronicInvoicing(req.body.electronicInvoicing);
    if (electronicInvoicing.error) return res.status(400).json({ error: electronicInvoicing.error });

    const { userId: ignoredUserId, electronicInvoicing: ignoredConfiguration, ...companyData } = req.body;
    if (electronicInvoicing.value) companyData.electronicInvoicing = electronicInvoicing.value;

    let company = await Company.findOne({ userId: req.userId });
    if (!company) {
      company = await Company.create({ ...companyData, userId: req.userId });
    } else {
      Object.assign(company, companyData);
      await company.save();
    }
    return res.json(company);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

module.exports = { getCompany, updateCompany };
