const Contact = require("../../models/contact");
const Invoice = require("../../models/invoice");
const Opportunity = require("../../models/opportunity");
const Task = require("../../models/task");

async function deleteContact(req, res) {
  try { const [usedInDocument, usedInTask, usedInOpportunity] = await Promise.all([Invoice.exists({ userId: req.userId, contactId: req.params.id }), Task.exists({ userId: req.userId, contactId: req.params.id }), Opportunity.exists({ userId: req.userId, contactId: req.params.id })]); if (usedInDocument || usedInTask || usedInOpportunity) return res.status(409).json({ error: "Ce contact est lié à des documents, actions ou opportunités et ne peut pas être supprimé" }); const contact = await Contact.findOneAndDelete({ _id: req.params.id, userId: req.userId }); if (!contact) return res.status(404).json({ error: "Contact introuvable" }); return res.json({ success: true }); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur suppression contact" }); }
}

async function toggleFavorite(req, res) {
  try { const contact = await Contact.findOne({ _id: req.params.id, userId: req.userId }); if (!contact) return res.status(404).json({ error: "Contact introuvable" }); contact.favorite = !contact.favorite; await contact.save(); return res.json(contact); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur favoris" }); }
}

module.exports = { deleteContact, toggleFavorite };
