const TreasuryEntry = require("../../models/treasuryEntry");

const ENTRY_TYPES = new Set(["income", "expense"]);

function getEntryData(body = {}) {
  return { label: String(body.label || "").trim(), amount: Number(body.amount), type: body.type, date: body.date };
}

function validateEntry(entry) {
  return Boolean(entry.label) && Number.isFinite(entry.amount) && entry.amount > 0 && ENTRY_TYPES.has(entry.type) && Boolean(entry.date);
}

async function createEntry(req, res) {
  try { const entry = getEntryData(req.body); if (!validateEntry(entry)) return res.status(400).json({ error: "Vérifiez le libellé, le montant, le type et la date" }); return res.status(201).json(await TreasuryEntry.create({ userId: req.userId, ...entry })); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de la création du mouvement" }); }
}

async function updateEntry(req, res) {
  try { const entryData = getEntryData(req.body); if (!validateEntry(entryData)) return res.status(400).json({ error: "Vérifiez le libellé, le montant, le type et la date" }); const entry = await TreasuryEntry.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, entryData, { new: true, runValidators: true }); if (!entry) return res.status(404).json({ error: "Mouvement introuvable" }); return res.json(entry); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de la modification du mouvement" }); }
}

async function deleteEntry(req, res) {
  try { const entry = await TreasuryEntry.findOneAndDelete({ _id: req.params.id, userId: req.userId }); if (!entry) return res.status(404).json({ error: "Mouvement introuvable" }); return res.json({ success: true }); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de la suppression du mouvement" }); }
}

module.exports = { createEntry, deleteEntry, getEntryData, updateEntry, validateEntry };
