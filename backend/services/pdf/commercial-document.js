const PDFDocument = require("pdfkit");

const PAGE = { left: 48, right: 547, width: 499, bottom: 748 };
const C = { ink: "#0f172a", muted: "#64748b", line: "#dbe3ef", panel: "#f8fafc", blue: "#2563eb", blueDark: "#173b84", blueSoft: "#eff6ff", green: "#047857", amber: "#b45309", red: "#b91c1c" };
const money = value => `${Number(value || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[\u00a0\u202f]/g, " ")} EUR`;
const shortDate = value => value ? new Date(value).toLocaleDateString("fr-FR") : "Non definie";
const clean = value => String(value || "").replace(/[\r\n]+/g, " ").trim();

function label(doc, value, x, y, width) {
  doc.fillColor(C.muted).font("Helvetica-Bold").fontSize(8).text(String(value).toUpperCase(), x, y, { width, characterSpacing: 0.65 });
}

function divider(doc, y) {
  doc.moveTo(PAGE.left, y).lineTo(PAGE.right, y).lineWidth(1).strokeColor(C.line).stroke();
}

function documentMeta(invoice, company, sourceInvoice) {
  if (invoice.type === "quote") return [`Validite : ${invoice.quoteValidityDays || company?.quoteValidity || 30} jours`];
  if (invoice.type === "order") return [invoice.convertedToInvoiceId ? "Facturation : facture emise" : "Facturation : a emettre"];
  if (invoice.type === "credit_note") return [sourceInvoice ? `Facture d'origine : ${sourceInvoice.invoiceNumber}` : "Avoir commercial"];
  const state = invoice.paymentStatus === "paid" ? `Reglee${invoice.paidAt ? ` le ${shortDate(invoice.paidAt)}` : ""}` : "Paiement en attente";
  return [state, `Conditions : ${clean(invoice.paymentTerms || company?.deliveryTerms || "Paiement a 30 jours")}`, invoice.paymentDueDate ? `Echeance : ${shortDate(invoice.paymentDueDate)}` : ""];
}

function addHeader(doc, { invoice, company, logoBuffer, title, dateLabel, sourceInvoice, continued = false }) {
  doc.rect(0, 0, 595, continued ? 110 : 158).fill(C.ink);
  doc.circle(548, 23, 92).fillOpacity(.16).fill(C.blue).fillOpacity(1);
  doc.circle(585, continued ? 95 : 137, 72).fillOpacity(.12).fill("#38bdf8").fillOpacity(1);
  if (logoBuffer) {
    try { doc.image(logoBuffer, PAGE.left, continued ? 27 : 36, { fit: [100, continued ? 55 : 70] }); } catch { /* logo invalide : le nom prend le relais */ }
  }
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(logoBuffer ? 16 : 23)
    .text(clean(company?.companyName || "Mon entreprise"), logoBuffer ? 160 : PAGE.left, continued ? 33 : 45, { width: 190 });
  if (!continued) {
    doc.fillColor("#bfdbfe").font("Helvetica").fontSize(8.8);
    [clean(company?.address), [clean(company?.postalCode), clean(company?.city)].filter(Boolean).join(" "), clean(company?.email), clean(company?.phone)].filter(Boolean).slice(0, 3)
      .forEach((line, index) => doc.text(line, logoBuffer ? 160 : PAGE.left, 74 + index * 13, { width: 215 }));
  }
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(continued ? 16 : 20)
    .text(continued ? `${title} - suite` : title, 350, continued ? 34 : 45, { width: 197, align: "right" });
  doc.fillColor("#bfdbfe").font("Helvetica").fontSize(9.5)
    .text(`N° ${invoice.invoiceNumber}`, 350, continued ? 57 : 76, { width: 197, align: "right" });
  if (!continued) {
    doc.text(`${dateLabel} : ${shortDate(invoice.createdAt)}`, 350, 92, { width: 197, align: "right" });
    documentMeta(invoice, company, sourceInvoice).filter(Boolean).slice(0, 2)
      .forEach((line, index) => doc.text(line, 350, 108 + index * 13, { width: 197, align: "right" }));
  }
  return continued ? 135 : 184;
}

function addTableHeader(doc, y) {
  doc.roundedRect(PAGE.left, y, PAGE.width, 31, 7).fill(C.blueSoft);
  doc.fillColor(C.blueDark).font("Helvetica-Bold").fontSize(8);
  doc.text("DESIGNATION", 62, y + 11, { width: 205, characterSpacing: .35 });
  doc.text("QTE", 272, y + 11, { width: 36, align: "right" });
  doc.text("PU HT", 315, y + 11, { width: 65, align: "right" });
  doc.text("REMISE", 387, y + 11, { width: 58, align: "right" });
  doc.text("TOTAL HT", 452, y + 11, { width: 77, align: "right" });
  return y + 48;
}

function addFooter(doc, company, invoice) {
  divider(doc, 716);
  doc.fillColor(C.muted).font("Helvetica").fontSize(7.8);
  const left = [clean(company?.companyName), company?.siret ? `SIRET : ${clean(company.siret)}` : "", company?.rcs ? `RCS : ${clean(company.rcs)}` : ""].filter(Boolean).join(" - ");
  const right = invoice.type === "invoice" ? `Facture ${invoice.invoiceNumber}` : `${invoice.invoiceNumber} - My Prospect`;
  doc.text(left, PAGE.left, 729, { width: 315 });
  doc.text(right, 360, 729, { width: 187, align: "right" });
}

function renderCommercialDocumentPdf({ output, invoice, company, contact, products, sourceInvoice, logoBuffer }) {
  const doc = new PDFDocument({ margin: 0, size: "A4", info: { Title: `${invoice.invoiceNumber || "Document"}` } });
  const title = invoice.isDepositInvoice ? "FACTURE D'ACOMPTE" : ({ quote: "DEVIS", order: "COMMANDE", credit_note: "AVOIR", invoice: "FACTURE" })[invoice.type] || "FACTURE";
  const dateLabel = ({ quote: "Date du devis", order: "Date de la commande", credit_note: "Date de l'avoir", invoice: "Date de la facture" })[invoice.type] || "Date";
  doc.pipe(output);
  let y = addHeader(doc, { invoice, company, logoBuffer, title, dateLabel, sourceInvoice });

  // Bloc client
  doc.roundedRect(PAGE.left, y, PAGE.width, 100, 12).fill(C.panel);
  label(doc, "Client", 65, y + 18, 210);
  doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(12.5)
    .text(clean(contact?.companyName || `${contact?.firstname || ""} ${contact?.lastname || ""}` || "Client"), 65, y + 35, { width: 285 });
  doc.fillColor(C.muted).font("Helvetica").fontSize(9.2);
  [clean(`${contact?.firstname || ""} ${contact?.lastname || ""}`), clean(contact?.billingAddress), clean(contact?.email), clean(contact?.phone)].filter(Boolean).slice(0, 3)
    .forEach((line, index) => doc.text(line, 65, y + 54 + index * 12.5, { width: 300 }));
  const statusText = invoice.type === "invoice" ? (invoice.paymentStatus === "paid" ? "PAYEE" : "A REGLER") : invoice.type === "quote" ? "A VALIDER" : invoice.type === "order" ? "COMMANDE" : "AVOIR";
  const statusColor = invoice.type === "invoice" && invoice.paymentStatus === "paid" ? C.green : invoice.type === "credit_note" ? C.amber : C.blue;
  doc.roundedRect(410, y + 22, 111, 27, 14).fill(statusColor);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8.3).text(statusText, 410, y + 32, { width: 111, align: "center" });
  doc.fillColor(C.muted).font("Helvetica").fontSize(8.5).text("Total TTC", 405, y + 63, { width: 116, align: "right" });
  doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(15.5).text(money(invoice.totalTTC), 381, y + 76, { width: 140, align: "right" });
  y = addTableHeader(doc, y + 130);

  for (const product of products) {
    const productHeight = Math.max(28, doc.heightOfString(clean(product.name), { width: 200, font: "Helvetica", size: 9.7 }) + 13);
    if (y + productHeight > 658) {
      addFooter(doc, company, invoice);
      doc.addPage();
      y = addHeader(doc, { invoice, company, logoBuffer, title, dateLabel, sourceInvoice, continued: true });
      y = addTableHeader(doc, y);
    }
    doc.fillColor(C.ink).font("Helvetica").fontSize(9.7).text(clean(product.name), 62, y, { width: 200, lineGap: 2 });
    doc.fillColor(C.ink).fontSize(9.3).text(String(product.quantity || 0), 272, y, { width: 36, align: "right" });
    doc.text(money(product.priceHT), 315, y, { width: 65, align: "right" });
    doc.text(`${Number(product.discount || 0).toLocaleString("fr-FR")} %`, 387, y, { width: 58, align: "right" });
    doc.font("Helvetica-Bold").text(money(product.totalHT), 452, y, { width: 77, align: "right" }).font("Helvetica");
    y += productHeight;
    doc.moveTo(62, y - 7).lineTo(529, y - 7).lineWidth(.6).strokeColor(C.line).stroke();
  }

  const totalHeight = 154;
  if (y + totalHeight > 690) {
    addFooter(doc, company, invoice);
    doc.addPage();
    y = addHeader(doc, { invoice, company, logoBuffer, title, dateLabel, sourceInvoice, continued: true });
  }
  const vat = Math.round((Number(invoice.totalTTC || 0) - Number(invoice.totalHT || 0)) * 100) / 100;
  const terms = clean(invoice.paymentTerms || company?.deliveryTerms || "Paiement a 30 jours");
  label(doc, "Informations de reglement", PAGE.left, y + 16, 220);
  doc.fillColor(C.muted).font("Helvetica").fontSize(9.2)
    .text(invoice.type === "quote" ? `Validite du devis : ${invoice.quoteValidityDays || company?.quoteValidity || 30} jours.` : terms, PAGE.left, y + 37, { width: 245, lineGap: 3 });
  if (invoice.type === "invoice" && invoice.paymentDueDate) doc.text(`Echeance : ${shortDate(invoice.paymentDueDate)}.`, PAGE.left, y + 68, { width: 245 });
  if (company?.companyIban) doc.text(`IBAN : ${clean(company.companyIban)}`, PAGE.left, y + 92, { width: 245 });
  doc.roundedRect(321, y, 226, 112, 10).fill(C.panel);
  doc.fillColor(C.muted).font("Helvetica").fontSize(9.3);
  doc.text("Total HT", 338, y + 18); doc.text(money(invoice.totalHT), 426, y + 18, { width: 102, align: "right" });
  doc.text("TVA", 338, y + 38); doc.text(money(vat), 426, y + 38, { width: 102, align: "right" });
  doc.moveTo(338, y + 63).lineTo(528, y + 63).lineWidth(1).strokeColor(C.line).stroke();
  doc.fillColor(C.ink).font("Helvetica-Bold").fontSize(11).text("TOTAL TTC", 338, y + 78);
  doc.fillColor(C.blue).fontSize(16).text(money(invoice.totalTTC), 402, y + 73, { width: 126, align: "right" });
  y += totalHeight;

  if (y + 68 > 704) { addFooter(doc, company, invoice); doc.addPage(); y = 120; }
  divider(doc, y);
  label(doc, "Mentions legales", PAGE.left, y + 16, 210);
  doc.fillColor(C.muted).font("Helvetica").fontSize(7.8).text(clean(company?.legalMentions || "Paiement selon les conditions convenues entre les parties."), PAGE.left, y + 31, { width: PAGE.width, lineGap: 2, height: 40, ellipsis: true });
  addFooter(doc, company, invoice);
  doc.end();
}

module.exports = { renderCommercialDocumentPdf };
