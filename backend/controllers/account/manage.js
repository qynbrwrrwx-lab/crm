const bcrypt = require("bcryptjs");

const AuditLog = require("../../models/auditLog");
const Company = require("../../models/companyModel");
const Contact = require("../../models/contact");
const Invoice = require("../../models/invoice");
const Product = require("../../models/product");
const StockMovement = require("../../models/stockMovement");
const User = require("../../models/user");
const { isValidPassword } = require("../../services/authSecurityService");
const { recordAuditEvent } = require("../../services/auditService");

async function exportAccountData(req, res) {
  try {
    const [user, company, contacts, products, invoices, stockMovements] = await Promise.all([
      User.findById(req.userId).select("email createdAt updatedAt"), Company.findOne({ userId: req.userId }),
      Contact.find({ userId: req.userId }), Product.find({ userId: req.userId }),
      Invoice.find({ userId: req.userId }), StockMovement.find({ userId: req.userId })
    ]);
    return res.json({ exportedAt: new Date().toISOString(), account: user, company, contacts, products, invoices, stockMovements });
  } catch (error) { console.error(error); return res.status(500).json({ error: "Impossible d'exporter les données" }); }
}

async function getAccountActivity(req, res) {
  try { return res.json(await AuditLog.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(20).select("action metadata createdAt")); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Impossible de récupérer l'activité" }); }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user || typeof currentPassword !== "string" || typeof newPassword !== "string") return res.status(400).json({ error: "Informations de mot de passe invalides" });
    if (!(await bcrypt.compare(currentPassword, user.password))) return res.status(400).json({ error: "Mot de passe actuel incorrect" });
    if (!isValidPassword(newPassword)) return res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 12 caractères" });
    user.password = await bcrypt.hash(newPassword, 10); await user.save();
    await recordAuditEvent({ userId: user._id, action: "user.password_changed" });
    return res.json({ success: true });
  } catch (error) { console.error(error); return res.status(500).json({ error: "Impossible de modifier le mot de passe" }); }
}

async function deleteAccount(req, res) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Compte introuvable" });
    if (typeof req.body.password !== "string" || !(await bcrypt.compare(req.body.password, user.password))) return res.status(400).json({ error: "Mot de passe incorrect" });
    await Promise.all([Company.deleteMany({ userId: req.userId }), Contact.deleteMany({ userId: req.userId }), Product.deleteMany({ userId: req.userId }), Invoice.deleteMany({ userId: req.userId }), StockMovement.deleteMany({ userId: req.userId }), AuditLog.deleteMany({ userId: req.userId })]);
    await user.deleteOne();
    return res.json({ success: true });
  } catch (error) { console.error(error); return res.status(500).json({ error: "Impossible de supprimer le compte" }); }
}

module.exports = { changePassword, deleteAccount, exportAccountData, getAccountActivity };
