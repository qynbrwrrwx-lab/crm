const crypto = require("crypto");

const Company = require("../../models/companyModel");
const Contact = require("../../models/contact");
const Invoice = require("../../models/invoice");
const User = require("../../models/user");
const { recordAuditEvent } = require("../../services/auditService");
const { sendEmail, sendInvoiceEmail } = require("../../services/emailService");
const { createEmailPdf } = require("../commercialDocumentPdfController");

function createQuoteClientLink(invoice, req) {
  const token = crypto.randomBytes(32).toString("hex");
  invoice.clientAccessTokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiryDays = Math.max(1, Number(invoice.quoteValidityDays || 30));
  invoice.clientAccessTokenExpiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/quote/${token}`;
}

async function sendPaymentReminder(req, res) {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.userId }).populate("contactId", "email");
    if (!invoice || invoice.type !== "invoice" || invoice.paymentStatus === "paid" || !invoice.contactId?.email) {
      return res.status(400).json({ error: "Relance indisponible pour cette facture" });
    }

    const sent = await sendEmail({
      to: invoice.contactId.email,
      subject: `Rappel de règlement — facture ${invoice.invoiceNumber}`,
      text: `Bonjour,\n\nSauf erreur de notre part, la facture ${invoice.invoiceNumber} reste en attente de règlement.\n\nCordialement`
    });
    if (!sent) return res.status(502).json({ error: "La relance n'a pas pu être envoyée" });

    invoice.paymentReminderSentAt = new Date();
    await invoice.save();
    await recordAuditEvent({
      userId: req.userId,
      action: "invoice.payment_reminder_sent",
      documentId: invoice._id,
      metadata: { invoiceNumber: invoice.invoiceNumber, recipient: invoice.contactId.email }
    });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de l'envoi de la relance" });
  }
}

async function sendCommercialDocumentEmail(req, res) {
  let invoice;
  try {
    invoice = await Invoice.findOne({ _id: req.params.id, userId: req.userId });
    if (!invoice || !["quote", "order", "invoice", "credit_note"].includes(invoice.type)) {
      return res.status(404).json({ error: "Document introuvable" });
    }

    const contact = await Contact.findOne({ _id: invoice.contactId, userId: req.userId });
    if (!contact?.email) return res.status(400).json({ error: "Le contact ne possède pas d'adresse email" });

    const [company, user] = await Promise.all([
      Company.findOne({ userId: req.userId }),
      User.findById(req.userId).select("email")
    ]);
    invoice.emailRecipient = contact.email;
    const clientQuoteLink = invoice.type === "quote" && invoice.status !== "accepted"
      ? createQuoteClientLink(invoice, req)
      : "";
    const sent = await sendInvoiceEmail({
      to: contact.email,
      invoice,
      pdfBuffer: await createEmailPdf(invoice, req.userId),
      senderName: company?.companyName || "Votre entreprise",
      replyTo: company?.replyToEmail || company?.email || user?.email || undefined,
      recipientName: contact.companyName || `${contact.firstname || ""} ${contact.lastname || ""}`.trim(),
      emailTemplate: { intro: company?.documentEmailIntro, closing: company?.documentEmailClosing },
      clientQuoteLink
    });

    if (!sent) {
      invoice.emailStatus = "failed";
      invoice.emailFailedAt = new Date();
      await invoice.save();
      await recordAuditEvent({
        userId: req.userId,
        action: "document.email_failed",
        documentId: invoice._id,
        metadata: { invoiceNumber: invoice.invoiceNumber, recipient: contact.email }
      });
      return res.status(502).json({ error: "L'email n'a pas pu être envoyé" });
    }

    invoice.emailSentAt = new Date();
    invoice.emailStatus = "sent";
    invoice.emailFailedAt = null;
    await invoice.save();
    await recordAuditEvent({
      userId: req.userId,
      action: "document.email_sent",
      documentId: invoice._id,
      metadata: { invoiceNumber: invoice.invoiceNumber, recipient: contact.email }
    });
    return res.json({ success: true, sentAt: invoice.emailSentAt });
  } catch (error) {
    console.error(error);
    if (invoice) {
      invoice.emailStatus = "failed";
      invoice.emailFailedAt = new Date();
      await invoice.save().catch(() => {});
      await recordAuditEvent({
        userId: req.userId,
        action: "document.email_failed",
        documentId: invoice._id,
        metadata: { invoiceNumber: invoice.invoiceNumber, recipient: invoice.emailRecipient }
      });
    }
    return res.status(500).json({ error: "Erreur lors de l'envoi de l'email" });
  }
}

module.exports = { sendCommercialDocumentEmail, sendPaymentReminder };
