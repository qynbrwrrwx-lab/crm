const Opportunity = require("../../models/opportunity");
const { STAGES, STAGE_PROBABILITIES } = require("./data");

async function updateOpportunityStage(req, res) {
  try {
    const stage = req.body.stage;
    if (!STAGES.has(stage)) return res.status(400).json({ error: "Étape invalide" });
    const lostReason = stage === "lost" ? String(req.body.lostReason || "").trim().slice(0, 100) : "";
    const opportunity = await Opportunity.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, { stage, probability: STAGE_PROBABILITIES[stage], lostReason }, { new: true });
    if (!opportunity) return res.status(404).json({ error: "Opportunité introuvable" });
    return res.json(opportunity);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la mise à jour de l'étape" });
  }
}

module.exports = { updateOpportunityStage };
