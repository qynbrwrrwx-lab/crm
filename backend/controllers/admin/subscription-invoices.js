const Company = require("../../models/companyModel");
const SubscriptionInvoice = require("../../models/subscriptionInvoice");
const User = require("../../models/user");
const { recordAuditEvent } = require("../../services/auditService");
const { sendEmail } = require("../../services/emailService");
const { createSubscriptionInvoicePdf } = require("../../services/subscriptionInvoicePdfService");
const { nextSubscriptionInvoiceNumber, parseOptionalDate, parseSubscriptionAmount, parseSubscriptionVatRate } = require("../../services/subscriptionInvoiceService");

const subscriptionInvoiceStatuses = ["draft", "sent", "paid", "cancelled"];

async function listSubscriptionInvoices(req, res) {
  try {
    const filter = req.query.userId ? { subscriberId: req.query.userId } : {};
    return res.json(await SubscriptionInvoice.find(filter).populate("subscriberId", "email").sort({ createdAt: -1 }).limit(100));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible de charger les factures d'abonnement" });
  }
}

async function renderSubscriptionInvoicePdf(req, res) {
  try {
    const invoice = await SubscriptionInvoice.findById(req.params.id).lean();
    if (!invoice) return res.status(404).json({ error: "Facture introuvable" });
    const pdf = await createSubscriptionInvoicePdf(invoice);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${invoice.invoiceNumber}.pdf"`);
    return res.send(pdf);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible de générer le PDF" });
  }
}

async function createSubscriptionInvoice(req, res) {
  try {
    const subscriber = await User.findById(req.params.id);
    if (!subscriber || subscriber.role === "admin") return res.status(400).json({ error: "Compte client introuvable" });
    const planName = String(req.body.planName || "").trim().slice(0, 120);
    const amountHT = parseSubscriptionAmount(req.body.amountHT);
    const vatRate = parseSubscriptionVatRate(req.body.vatRate ?? 20);
    const dueDate = parseOptionalDate(req.body.dueDate);
    if (!planName || amountHT === null || vatRate === null || dueDate === undefined) return res.status(400).json({ error: "Vérifiez le libellé, le montant, la TVA et l’échéance" });
    const company = await Company.findOne({ userId: subscriber._id }).lean();
    const totalTTC = Math.round(amountHT * (1 + vatRate / 100) * 100) / 100;
    const invoice = await SubscriptionInvoice.create({
      subscriberId: subscriber._id, createdBy: req.user._id, invoiceNumber: await nextSubscriptionInvoiceNumber(), planName, amountHT, vatRate, totalTTC, dueDate,
      recipient: { email: subscriber.email, companyName: company?.companyName || "", siret: company?.siret || "", address: company?.address || "", postalCode: company?.postalCode || "", city: company?.city || "" }
    });
    await recordAuditEvent({ userId: req.user._id, action: "admin.subscription_invoice_created", metadata: { subscriberId: subscriber._id.toString(), targetEmail: subscriber.email, invoiceNumber: invoice.invoiceNumber, totalTTC } });
    return res.status(201).json(invoice);
  } catch (error) {
    console.error(error);
    return res.status(error?.code === 11000 ? 409 : 500).json({ error: error?.code === 11000 ? "Numéro de facture déjà utilisé. Réessayez." : "Impossible de créer la facture d’abonnement" });
  }
}

async function sendSubscriptionInvoice(req, res) {
  try {
    const invoice = await SubscriptionInvoice.findById(req.params.id);
    if (!invoice || invoice.status === "cancelled") return res.status(400).json({ error: "Envoi indisponible" });
    const pdf = await createSubscriptionInvoicePdf(invoice.toObject());
    const sent = await sendEmail({
      to: invoice.recipient.email,
      subject: `Votre facture d’abonnement My Prospect ${invoice.invoiceNumber}`,
      html: `<div style="font-family:Arial,sans-serif;color:#0f172a"><h2>Votre facture d’abonnement</h2><p>Bonjour,</p><p>Veuillez trouver ci-joint votre facture d’abonnement <strong>${invoice.invoiceNumber}</strong>, d’un montant de <strong>${Number(invoice.totalTTC).toFixed(2)} € TTC</strong>.</p><p>Merci de votre confiance,<br>My Prospect</p></div>`,
      attachments: [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdf, contentType: "application/pdf" }]
    });
    if (!sent) return res.status(502).json({ error: "L’e-mail n’a pas pu être envoyé" });
    invoice.status = invoice.status === "paid" ? "paid" : "sent";
    invoice.sentAt = new Date();
    await invoice.save();
    await recordAuditEvent({ userId: req.user._id, action: "admin.subscription_invoice_sent", metadata: { invoiceNumber: invoice.invoiceNumber, targetEmail: invoice.recipient.email } });
    return res.json(invoice);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible d’envoyer la facture" });
  }
}

async function updateSubscriptionInvoiceStatus(req, res) {
  try {
    const status = String(req.body.status || "");
    if (!subscriptionInvoiceStatuses.includes(status)) return res.status(400).json({ error: "Statut invalide" });
    const invoice = await SubscriptionInvoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Facture introuvable" });
    invoice.status = status;
    invoice.paidAt = status === "paid" ? new Date() : null;
    await invoice.save();
    await recordAuditEvent({ userId: req.user._id, action: "admin.subscription_invoice_status_updated", metadata: { invoiceNumber: invoice.invoiceNumber, status } });
    return res.json(invoice);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible de mettre à jour la facture" });
  }
}

module.exports = { createSubscriptionInvoice, listSubscriptionInvoices, renderSubscriptionInvoicePdf, sendSubscriptionInvoice, updateSubscriptionInvoiceStatus };
