const Supplier = require("../../models/supplier");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSupplierData(body = {}) {
  return { name: String(body.name || "").trim(), contactName: String(body.contactName || "").trim(), email: String(body.email || "").trim().toLowerCase(), phone: String(body.phone || "").trim(), notes: String(body.notes || "").trim() };
}

function validateSupplier(data) {
  if (!data.name) return "Le nom du fournisseur est obligatoire";
  if (data.email && !EMAIL_PATTERN.test(data.email)) return "L'adresse e-mail est invalide";
  return null;
}

async function listSuppliers(req, res) {
  try { return res.json(await Supplier.find({ userId: req.userId }).sort({ name: 1 })); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de la récupération des fournisseurs" }); }
}

async function createSupplier(req, res) {
  try { const data = getSupplierData(req.body); const validationError = validateSupplier(data); if (validationError) return res.status(400).json({ error: validationError }); return res.status(201).json(await Supplier.create({ userId: req.userId, ...data })); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de la création du fournisseur" }); }
}

async function updateSupplier(req, res) {
  try { const data = getSupplierData(req.body); const validationError = validateSupplier(data); if (validationError) return res.status(400).json({ error: validationError }); const supplier = await Supplier.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, data, { new: true, runValidators: true }); if (!supplier) return res.status(404).json({ error: "Fournisseur introuvable" }); return res.json(supplier); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de la modification du fournisseur" }); }
}

async function deleteSupplier(req, res) {
  try { const supplier = await Supplier.findOneAndDelete({ _id: req.params.id, userId: req.userId }); if (!supplier) return res.status(404).json({ error: "Fournisseur introuvable" }); return res.json({ success: true }); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de la suppression du fournisseur" }); }
}

module.exports = { createSupplier, deleteSupplier, listSuppliers, updateSupplier };
