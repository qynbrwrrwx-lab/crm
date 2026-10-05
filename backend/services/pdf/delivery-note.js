const PDFDocument = require("pdfkit");

function renderDeliveryNote({ output, order, company, contact }) {
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  doc.pipe(output);
  const name = company?.companyName || "Entreprise";
  doc.rect(0, 0, 595, 130).fill("#0f172a");
  doc.fillColor("white").font("Helvetica-Bold").fontSize(22).text(name, 48, 42);
  doc.fontSize(19).text("BON DE LIVRAISON", 320, 42, { width: 225, align: "right" });
  doc.fillColor("#bfdbfe").font("Helvetica").fontSize(9).text(`Commande ${order.invoiceNumber}`, 320, 73, { width: 225, align: "right" });
  doc.text(`Édité le ${new Date().toLocaleDateString("fr-FR")}`, 320, 88, { width: 225, align: "right" });
  doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(9).text("LIVRER À", 48, 165);
  doc.fontSize(12).text(contact?.companyName || `${contact?.firstname || ""} ${contact?.lastname || ""}`.trim() || "Client", 48, 181);
  doc.font("Helvetica").fontSize(10).text(contact?.shippingAddress || contact?.billingAddress || "Adresse non renseignée", 48, 200, { width: 270 });
  doc.roundedRect(48, 255, 499, 30, 6).fill("#eff6ff");
  doc.fillColor("#173b84").font("Helvetica-Bold").fontSize(9).text("PRODUITS LIVRÉS", 62, 266);
  doc.text("QUANTITÉ", 432, 266, { width: 82, align: "right" });
  let y = 307;
  order.products.forEach((item, index) => {
    if (y > 685) { doc.addPage(); y = 65; }
    doc.fillColor("#0f172a").font("Helvetica").fontSize(10.5).text(item.productName || "Produit", 62, y, { width: 330 });
    doc.font("Helvetica-Bold").text(String(item.quantity || 0), 432, y, { width: 82, align: "right" });
    doc.moveTo(62, y + 21).lineTo(514, y + 21).strokeColor("#dbe3ef").stroke(); y += 34;
  });
  doc.fillColor("#64748b").font("Helvetica").fontSize(8).text("Les prix et montants ne figurent pas sur ce bon de livraison.", 48, 730, { width: 499, align: "center" });
  doc.end();
}

module.exports = { renderDeliveryNote };
