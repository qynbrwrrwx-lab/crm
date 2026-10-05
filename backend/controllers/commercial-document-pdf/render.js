const { PassThrough } = require("stream");

const Company = require("../../models/companyModel");
const Contact = require("../../models/contact");
const Invoice = require("../../models/invoice");
const Product = require("../../models/product");
const { renderCommercialDocumentPdf } = require("../../services/commercialDocumentPdfService");

async function getCommercialDocumentPdfData(documentId, userId) {
  const invoice = await Invoice.findOne({ _id: documentId, userId }).lean();
  if (!invoice) return null;

  const [company, contact, sourceInvoice] = await Promise.all([
    Company.findOne({ userId }).lean(),
    Contact.findOne({ _id: invoice.contactId, userId }).lean(),
    invoice.type === "credit_note" && invoice.sourceDocumentId
      ? Invoice.findOne({ _id: invoice.sourceDocumentId, userId }).lean()
      : null
  ]);
  const productIds = invoice.products.map(item => item.productId).filter(Boolean);
  const productsById = new Map((await Product.find({ _id: { $in: productIds }, userId }).lean())
    .map(product => [String(product._id), product]));
  const products = invoice.products.map(item => {
    const product = productsById.get(String(item.productId));
    const quantity = Number(item.quantity || 0);
    const unitHT = Number(item.unitHT ?? product?.priceHT ?? 0);
    const discount = Number(item.discount || 0);
    return {
      name: item.productName || product?.name || "Produit",
      quantity,
      priceHT: unitHT,
      discount,
      totalHT: Number(item.lineHT ?? (unitHT * quantity * (1 - discount / 100)))
    };
  });

  let logoBuffer = null;
  if (company?.logo) {
    try {
      logoBuffer = Buffer.from(company.logo.replace(/^data:image\/\w+;base64,/, ""), "base64");
    } catch {
      logoBuffer = null;
    }
  }

  return { company, contact, invoice, logoBuffer, products, sourceInvoice };
}

async function renderDocumentPdf(req, res) {
  try {
    const documentData = await getCommercialDocumentPdfData(req.params.id, req.userId);
    if (!documentData) return res.status(404).send("Document introuvable");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${documentData.invoice.invoiceNumber}.pdf"`);
    renderCommercialDocumentPdf({ output: res, ...documentData });
  } catch (error) {
    console.error("Erreur PDF :", error);
    if (!res.headersSent) return res.status(500).send("Erreur PDF");
    return res.end();
  }
}

function createEmailPdf(invoice, userId) {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    const chunks = [];
    output.setHeader = () => {};
    output.status = () => output;
    output.send = () => reject(new Error("Impossible de générer le PDF joint"));
    output.on("data", chunk => chunks.push(chunk));
    output.on("end", () => resolve(Buffer.concat(chunks)));
    output.on("error", reject);
    renderDocumentPdf({ params: { id: String(invoice._id) }, userId }, output).catch(reject);
  });
}

module.exports = { createEmailPdf, renderDocumentPdf };
