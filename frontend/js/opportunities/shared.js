// Opportunités : constantes et utilitaires partagés.

const opportunityStages = { lead: "Nouveaux prospects", qualified: "Qualifiés", proposal: "Propositions", won: "Gagnées", lost: "Perdues" };
const opportunityStageProbability = { lead: 20, qualified: 40, proposal: 70, won: 100, lost: 0 };
const opportunityCurrency = value => `${Number(value || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const opportunityContactName = item => item.contactId?.companyName || `${item.contactId?.firstname || ""} ${item.contactId?.lastname || ""}`.trim() || "Sans contact";
const opportunityLostReasons = { price: "Budget / prix", competition: "Choix d’un concurrent", timing: "Projet reporté", no_need: "Besoin abandonné", no_response: "Sans réponse", other: "Autre" };

function getRenderedOpportunities(opportunities = allOpportunities) {
  return Object.keys(opportunityStages).flatMap(stage => opportunities.filter(item => item.stage === stage));
}
