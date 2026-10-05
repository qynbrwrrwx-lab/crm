const Opportunity = require("../../models/opportunity");

async function listOpportunities(req, res) {
  try {
    return res.json(await Opportunity.find({ userId: req.userId }).populate("contactId", "firstname lastname companyName").sort({ updatedAt: -1 }));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération des opportunités" });
  }
}

module.exports = { listOpportunities };
