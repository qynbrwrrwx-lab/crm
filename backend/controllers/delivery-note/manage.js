const { PassThrough } = require("stream");

const Company = require("../../models/companyModel");
const Contact = require("../../models/contact");
const Invoice = require("../../models/invoice");
const { recordAuditEvent } = require("../../services/auditService");
const { sendEmail } = require("../../services/emailService");
const { renderDeliveryNote } = require("../../services/deliveryNotePdfService");

async function getOrderContext(documentId, userId, { lean = false } = {}) {
  let query = Invoice.findOne({ _id: documentId, userId, type: "order" });
  if (lean) query = query.lean();

  const order = await query;
  if (!order) return null;

  const [company, contact] = await Promise.all([
    Company.findOne({ userId }).lean(),
    Contact.findOne({ _id: order.contactId, userId }).lean()
  ]);
  return { company, contact, order };
}

function renderDeliveryNoteBuffer({ order, company, contact }) {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    const chunks = [];
    output.on("data", chunk => chunks.push(chunk));
    output.on("end", () => resolve(Buffer.concat(chunks)));
    output.on("error", reject);
    renderDeliveryNote({ output, order, company, contact });
  });
}

async function renderOrderDeliveryNote(req, res) {
  try {
    const context = await getOrderContext(req.params.id, req.userId, { lean: true });
    if (!context) return res.status(404).json({ error: "Commande introuvable" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="BL-${context.order.invoiceNumber}.pdf"`);
    renderDeliveryNote({ output: res, ...context });
  } catch (error) {
    console.error(error);
    if (!res.headersSent) return res.status(500).json({ error: "Impossible de générer le bon de livraison" });
    return res.end();
  }
}

async function sendOrderDeliveryNote(req, res) {
  try {
    const context = await getOrderContext(req.params.id, req.userId);
    if (!context) return res.status(404).json({ error: "Commande introuvable" });
    if (!context.contact?.email) {
      return res.status(400).json({ error: "Ajoutez l’adresse e-mail du client avant l’envoi" });
    }

    const pdf = await renderDeliveryNoteBuffer(context);
    const { order, company, contact } = context;
    const sent = await sendEmail({
      to: contact.email,
      replyTo: company?.replyToEmail || company?.email || undefined,
      subject: `Bon de livraison - commande ${order.invoiceNumber}`,
      text: `Bonjour,\n\nVeuillez trouver ci-joint le bon de livraison de votre commande ${order.invoiceNumber}.\n\nCordialement`,
      attachments: [{ filename: `BL-${order.invoiceNumber}.pdf`, content: pdf, contentType: "application/pdf" }]
    });
    if (!sent) return res.status(502).json({ error: "Le bon de livraison n’a pas pu être envoyé" });

    await recordAuditEvent({
      userId: req.userId,
      action: "order.delivery_note_sent",
      documentId: order._id,
      metadata: { invoiceNumber: order.invoiceNumber, recipient: contact.email }
    });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Impossible d’envoyer le bon de livraison" });
  }
}

module.exports = { renderOrderDeliveryNote, sendOrderDeliveryNote };
