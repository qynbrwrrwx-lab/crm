const { isSmtpConfigured, sendEmail } = require("./transport");
const { buildDocumentEmailHtml, personalizeEmailText } = require("./templates");

function getDocumentDetails(invoice) {
  const isQuote = invoice.type === "quote";
  const documentName = isQuote ? "devis" : invoice.type === "credit_note" ? "avoir" : "facture";
  const title = isQuote
    ? "📄 Nouveau devis"
    : invoice.type === "order"
      ? "📦 Nouvelle commande"
      : invoice.type === "credit_note"
        ? "↩️ Nouvel avoir"
        : "🧾 Nouvelle facture";

  return { documentName, isQuote, title };
}

function sanitizeSenderName(senderName) {
  return String(senderName || "")
    .replace(/[\r\n]/g, " ")
    .trim()
    .slice(0, 120);
}

async function sendInvoiceEmail({
  to,
  invoice,
  pdfBuffer,
  replyTo,
  senderName,
  recipientName,
  emailTemplate,
  clientQuoteLink
}) {
  try {
    if (!isSmtpConfigured) return false;

    if (!to) {
      console.log("⚠️ Aucun email client");
      return;
    }

    const { documentName, isQuote, title } = getDocumentDetails(invoice);
    const total = Number(invoice.totalTTC || 0).toFixed(2);
    const templateValues = {
      client: recipientName || "Madame, Monsieur",
      document: documentName,
      numero: invoice.invoiceNumber,
      total: `${total} €`
    };
    const intro = personalizeEmailText(
      emailTemplate?.intro,
      templateValues,
      "Bonjour {{client}},\n\nVeuillez trouver ci-joint votre {{document}} {{numero}}."
    );
    const closing = personalizeEmailText(
      emailTemplate?.closing,
      templateValues,
      "Merci pour votre confiance."
    );
    const safeSenderName = sanitizeSenderName(senderName);
    const sent = await sendEmail({
      to,
      from: safeSenderName
        ? `My Prospect — ${safeSenderName} <${process.env.EMAIL_FROM}>`
        : process.env.EMAIL_FROM,
      replyTo: replyTo || undefined,
      subject: `Votre ${documentName} ${invoice.invoiceNumber}`,
      html: buildDocumentEmailHtml({
        title,
        intro,
        closing,
        documentNumber: invoice.invoiceNumber,
        total,
        paymentStatus: invoice.paymentStatus,
        quoteLink: isQuote ? clientQuoteLink : null
      }),
      attachments: [{
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf"
      }]
    });

    if (!sent) return false;

    console.log(`✅ Email envoyé à ${to}`);
    return true;
  } catch (err) {
    console.error("❌ EMAIL ERROR :", err);
    return false;
  }
}

module.exports = { sendInvoiceEmail };
