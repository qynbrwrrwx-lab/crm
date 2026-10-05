const Company = require("../../models/companyModel");
const Product = require("../../models/product");
const Supplier = require("../../models/supplier");
const User = require("../../models/user");
const { sendEmail } = require("../../services/emailService");

async function sendRestockRequest(req, res) {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, userId: req.userId });
    if (!supplier) return res.status(404).json({ error: "Fournisseur introuvable" });
    if (!supplier.email) return res.status(400).json({ error: "Ajoutez une adresse e-mail à ce fournisseur avant l’envoi" });
    const products = await Product.find({ userId: req.userId });
    const normalizedName = supplier.name.toLocaleLowerCase("fr-FR");
    const urgentProducts = products.filter(product => String(product.supplierName || "").trim().toLocaleLowerCase("fr-FR") === normalizedName && Number(product.stock || 0) <= Number(product.lowStockThreshold ?? 5));
    if (!urgentProducts.length) return res.status(400).json({ error: "Aucun produit de ce fournisseur ne nécessite de réassort" });
    const [company, user] = await Promise.all([Company.findOne({ userId: req.userId }), User.findById(req.userId).select("email")]);
    const sender = String(company?.companyName || "Votre entreprise").replace(/[\r\n]/g, " ").trim().slice(0, 120);
    const rows = urgentProducts.sort((left, right) => Number(left.stock || 0) - Number(right.stock || 0)).map(product => { const quantity = Math.max(1, Number(product.lowStockThreshold ?? 5) * 2 - Number(product.stock || 0)); return `- ${product.name}${product.reference ? ` (${product.reference})` : ""} : ${quantity} unité(s)`; }).join("\n");
    const sent = await sendEmail({ to: supplier.email, from: process.env.EMAIL_FROM ? `My Prospect — ${sender} <${process.env.EMAIL_FROM}>` : undefined, replyTo: company?.replyToEmail || company?.email || user?.email || undefined, subject: `Demande de réassort — ${sender}`, text: `Bonjour ${supplier.contactName || ""},\n\nNous souhaitons préparer le réassort suivant :\n\n${rows}\n\nMerci de nous communiquer vos disponibilités et délais.\n\nCordialement,\n${sender}` });
    if (!sent) return res.status(502).json({ error: "L’e-mail de réassort n’a pas pu être envoyé" });
    supplier.lastRestockRequestAt = new Date();
    await supplier.save();
    return res.json({ success: true, count: urgentProducts.length, lastRestockRequestAt: supplier.lastRestockRequestAt });
  } catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de l’envoi de la demande de réassort" }); }
}

module.exports = { sendRestockRequest };
