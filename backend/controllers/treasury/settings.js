const TreasuryEntry = require("../../models/treasuryEntry");
const TreasurySettings = require("../../models/treasurySettings");

async function getTreasury(req, res) {
  try { const [settings, entries] = await Promise.all([TreasurySettings.findOne({ userId: req.userId }), TreasuryEntry.find({ userId: req.userId }).sort({ date: -1, createdAt: -1 })]); return res.json({ settings: settings || { openingBalance: 0, openingBalanceDate: new Date() }, entries }); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de la récupération de la trésorerie" }); }
}

async function updateSettings(req, res) {
  try { const openingBalance = Number(req.body.openingBalance); const minimumBalance = Number(req.body.minimumBalance || 0); const openingBalanceDate = req.body.openingBalanceDate; if (!Number.isFinite(openingBalance) || !Number.isFinite(minimumBalance) || minimumBalance < 0 || !openingBalanceDate) return res.status(400).json({ error: "Solde, réserve minimale et date de référence valides requis" }); const settings = await TreasurySettings.findOneAndUpdate({ userId: req.userId }, { openingBalance, openingBalanceDate, minimumBalance }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }); return res.json(settings); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de la mise à jour des réglages" }); }
}

module.exports = { getTreasury, updateSettings };
