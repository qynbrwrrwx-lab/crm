const crypto = require("crypto");
const TreasuryEntry = require("../../models/treasuryEntry");
const { getEntryData, validateEntry } = require("./entries");

function createImportFingerprint(entry) {
  const source = `${entry.date}|${entry.type}|${entry.amount.toFixed(2)}|${entry.label.toLocaleLowerCase("fr-FR")}`;
  return crypto.createHash("sha256").update(source).digest("hex");
}

async function importEntries(req, res) {
  try {
    const sourceEntries = Array.isArray(req.body.entries) ? req.body.entries.slice(0, 500) : [];
    if (!sourceEntries.length) return res.status(400).json({ error: "Aucun mouvement valide à importer" });
    const candidates = sourceEntries.map(raw => getEntryData(raw)).filter(validateEntry).map(entry => ({ ...entry, userId: req.userId, importFingerprint: createImportFingerprint(entry) }));
    if (!candidates.length) return res.status(400).json({ error: "Le fichier ne contient aucun mouvement exploitable" });
    const fingerprints = candidates.map(entry => entry.importFingerprint);
    const existing = await TreasuryEntry.find({ userId: req.userId, importFingerprint: { $in: fingerprints } }).select("importFingerprint").lean();
    const existingFingerprints = new Set(existing.map(entry => entry.importFingerprint));
    const uniqueEntries = [...new Map(candidates.filter(entry => !existingFingerprints.has(entry.importFingerprint)).map(entry => [entry.importFingerprint, entry])).values()];
    if (uniqueEntries.length) await TreasuryEntry.insertMany(uniqueEntries, { ordered: false });
    return res.status(201).json({ imported: uniqueEntries.length, ignored: candidates.length - uniqueEntries.length });
  } catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de l'import des mouvements" }); }
}

module.exports = { importEntries };
