const Contact = require("../../models/contact");

const editableFields = ["type", "firstname", "lastname", "companyName", "siret", "email", "phone", "billingAddress", "shippingAddress", "notes", "tags", "nextFollowUpAt", "lat", "lng"];

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.map(tag => String(tag || "").trim().replace(/\s+/g, " ")).filter(Boolean).filter(tag => tag.length <= 32))].slice(0, 10);
}

function normalizeFollowUpDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setHours(12, 0, 0, 0);
  return date;
}

function getEditableContactData(body) {
  const data = Object.fromEntries(Object.entries(body).filter(([key]) => editableFields.includes(key)));
  if (Object.hasOwn(data, "tags")) data.tags = normalizeTags(data.tags);
  if (Object.hasOwn(data, "nextFollowUpAt")) data.nextFollowUpAt = normalizeFollowUpDate(data.nextFollowUpAt);
  return data;
}

async function listContacts(req, res) {
  try { return res.json(await Contact.find({ userId: req.userId }).sort({ createdAt: -1 })); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur récupération contacts" }); }
}

async function createContact(req, res) {
  try { const nextFollowUpAt = normalizeFollowUpDate(req.body.nextFollowUpAt); if (nextFollowUpAt === undefined) return res.status(400).json({ error: "La date de relance est invalide" }); const contact = await Contact.create({ ...req.body, tags: normalizeTags(req.body.tags), nextFollowUpAt, userId: req.userId }); return res.json(contact); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur création contact" }); }
}

async function updateContact(req, res) {
  try { const data = getEditableContactData(req.body); if (data.nextFollowUpAt === undefined) return res.status(400).json({ error: "La date de relance est invalide" }); const contact = await Contact.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, data, { new: true, runValidators: true }); if (!contact) return res.status(404).json({ error: "Contact introuvable" }); return res.json(contact); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur modification contact" }); }
}

module.exports = { createContact, listContacts, updateContact };
