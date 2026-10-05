const Opportunity = require("../../models/opportunity");
const { contactIsOwned, getOpportunityData } = require("./data");

async function createOpportunity(req, res) {
  try {
    const data = getOpportunityData(req.body);
    if (!data.title) return res.status(400).json({ error: "Le nom de l’opportunité est obligatoire" });
    if (!await contactIsOwned(data.contactId, req.userId)) return res.status(400).json({ error: "Le client associé est introuvable" });
    return res.status(201).json(await Opportunity.create({ userId: req.userId, ...data }));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la création de l'opportunité" });
  }
}

async function updateOpportunity(req, res) {
  try {
    const data = getOpportunityData(req.body);
    if (!data.title) return res.status(400).json({ error: "Le nom de l’opportunité est obligatoire" });
    if (!await contactIsOwned(data.contactId, req.userId)) return res.status(400).json({ error: "Le client associé est introuvable" });
    const opportunity = await Opportunity.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, data, { new: true, runValidators: true });
    if (!opportunity) return res.status(404).json({ error: "Opportunité introuvable" });
    return res.json(opportunity);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la modification de l'opportunité" });
  }
}

async function deleteOpportunity(req, res) {
  try {
    const opportunity = await Opportunity.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!opportunity) return res.status(404).json({ error: "Opportunité introuvable" });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la suppression de l'opportunité" });
  }
}

module.exports = { createOpportunity, deleteOpportunity, updateOpportunity };
