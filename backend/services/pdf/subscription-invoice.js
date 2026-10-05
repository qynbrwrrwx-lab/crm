const PDFDocument = require("pdfkit");

const page = { left: 48, right: 547, width: 499 };
const colors = { ink: "#0f172a", muted: "#64748b", line: "#dbe3ef", panel: "#f8fafc", blue: "#2563eb", blueDark: "#173b84", blueSoft: "#eff6ff", green: "#047857" };
const money = value => `${Number(value || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
const date = value => value ? new Date(value).toLocaleDateString("fr-FR") : "A reception";

function text(document, value, x, y, options = {}) {
  document.text(String(value || ""), x, y, options);
}

function label(document, value, x, y, width) {
  document.fillColor(colors.muted).font("Helvetica-Bold").fontSize(8);
  text(document, String(value).toUpperCase(), x, y, { width, characterSpacing: 0.7 });
}

function line(document, y) {
  document.moveTo(page.left, y).lineTo(page.right, y).lineWidth(1).strokeColor(colors.line).stroke();
}

function createSubscriptionInvoicePdf(invoice) {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ margin: 0, size: "A4", info: { Title: `Facture ${invoice.invoiceNumber}` } });
    const chunks = [];
    document.on("data", chunk => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    const issuer = {
      name: process.env.PLATFORM_COMPANY_NAME || "My Prospect",
      email: process.env.PLATFORM_COMPANY_EMAIL || process.env.EMAIL_FROM || "",
      address: process.env.PLATFORM_COMPANY_ADDRESS || "",
      siret: process.env.PLATFORM_COMPANY_SIRET || ""
    };
    const vatAmount = Math.round((Number(invoice.totalTTC || 0) - Number(invoice.amountHT || 0)) * 100) / 100;
    const status = ({ draft: "BROUILLON", sent: "ENVOYEE", paid: "PAYEE", cancelled: "ANNULEE" })[invoice.status] || "BROUILLON";

    document.rect(0, 0, 595, 158).fill(colors.ink);
    document.circle(535, 25, 92).fillOpacity(0.16).fill(colors.blue).fillOpacity(1);
    document.circle(576, 137, 75).fillOpacity(0.12).fill("#38bdf8").fillOpacity(1);
    document.fillColor("#ffffff").font("Helvetica-Bold").fontSize(23);
    text(document, issuer.name, page.left, 44, { width: 260 });
    document.fillColor("#bfdbfe").font("Helvetica").fontSize(9);
    [issuer.address, issuer.email, issuer.siret ? `SIRET : ${issuer.siret}` : ""].filter(Boolean).forEach((value, index) => text(document, value, page.left, 80 + index * 14, { width: 280 }));
    document.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20);
    text(document, "FACTURE", 350, 46, { width: 197, align: "right" });
    document.fillColor("#bfdbfe").font("Helvetica").fontSize(10);
    text(document, `N° ${invoice.invoiceNumber}`, 350, 77, { width: 197, align: "right" });
    text(document, `Emise le ${date(invoice.createdAt)}`, 350, 93, { width: 197, align: "right" });
    text(document, `Echeance ${date(invoice.dueDate)}`, 350, 109, { width: 197, align: "right" });

    document.roundedRect(page.left, 184, page.width, 104, 12).fill(colors.panel);
    label(document, "Facture a", 66, 202, 210);
    document.fillColor(colors.ink).font("Helvetica-Bold").fontSize(13);
    text(document, invoice.recipient.companyName || invoice.recipient.email, 66, 220, { width: 275 });
    document.fillColor(colors.muted).font("Helvetica").fontSize(9.5);
    const recipientLines = [invoice.recipient.address, [invoice.recipient.postalCode, invoice.recipient.city].filter(Boolean).join(" "), invoice.recipient.siret ? `SIRET : ${invoice.recipient.siret}` : "", invoice.recipient.email].filter(Boolean);
    recipientLines.slice(0, 3).forEach((value, index) => text(document, value, 66, 240 + index * 13, { width: 285 }));
    const statusColor = invoice.status === "paid" ? colors.green : invoice.status === "cancelled" ? "#b91c1c" : colors.blue;
    document.roundedRect(418, 207, 104, 28, 14).fill(statusColor);
    document.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8.5);
    text(document, status, 418, 217, { width: 104, align: "center" });
    document.fillColor(colors.muted).font("Helvetica").fontSize(8.5);
    text(document, "Total a regler", 397, 247, { width: 125, align: "right" });
    document.fillColor(colors.ink).font("Helvetica-Bold").fontSize(16);
    text(document, money(invoice.totalTTC), 380, 260, { width: 142, align: "right" });

    label(document, "Detail de la facturation", page.left, 320, 260);
    document.roundedRect(page.left, 340, page.width, 32, 7).fill(colors.blueSoft);
    document.fillColor(colors.blueDark).font("Helvetica-Bold").fontSize(8);
    text(document, "DESIGNATION", 63, 352, { width: 250, characterSpacing: 0.4 });
    text(document, "MONTANT HT", 318, 352, { width: 80, align: "right" });
    text(document, "TVA", 407, 352, { width: 52, align: "right" });
    text(document, "TOTAL TTC", 466, 352, { width: 64, align: "right" });
    document.fillColor(colors.ink).font("Helvetica").fontSize(10.5);
    text(document, invoice.planName, 63, 393, { width: 240 });
    text(document, money(invoice.amountHT), 318, 393, { width: 80, align: "right" });
    text(document, `${Number(invoice.vatRate || 0).toLocaleString("fr-FR")} %`, 407, 393, { width: 52, align: "right" });
    text(document, money(invoice.totalTTC), 450, 393, { width: 80, align: "right" });
    line(document, 426);

    document.roundedRect(320, 449, 227, 108, 10).fill(colors.panel);
    document.fillColor(colors.muted).font("Helvetica").fontSize(9.5);
    text(document, "Sous-total HT", 338, 467);
    text(document, money(invoice.amountHT), 425, 467, { width: 103, align: "right" });
    text(document, `TVA (${Number(invoice.vatRate || 0).toLocaleString("fr-FR")} %)`, 338, 486);
    text(document, money(vatAmount), 425, 486, { width: 103, align: "right" });
    document.moveTo(338, 510).lineTo(528, 510).lineWidth(1).strokeColor(colors.line).stroke();
    document.fillColor(colors.ink).font("Helvetica-Bold").fontSize(11);
    text(document, "TOTAL TTC", 338, 524);
    document.fillColor(colors.blue).fontSize(16);
    text(document, money(invoice.totalTTC), 403, 519, { width: 125, align: "right" });

    label(document, "Informations", page.left, 466, 210);
    document.fillColor(colors.muted).font("Helvetica").fontSize(9.5);
    text(document, `Reglement attendu au plus tard le ${date(invoice.dueDate)}.`, page.left, 486, { width: 245, lineGap: 3 });
    text(document, "Conservez cette facture pour votre comptabilite.", page.left, 519, { width: 245, lineGap: 3 });
    line(document, 706);
    document.fillColor(colors.muted).font("Helvetica").fontSize(8);
    text(document, `${issuer.name} - Facture d'abonnement ${invoice.invoiceNumber}`, page.left, 721, { width: 300 });
    text(document, "Document genere par My Prospect", 330, 721, { width: 217, align: "right" });
    document.end();
  });
}

module.exports = { createSubscriptionInvoicePdf };
