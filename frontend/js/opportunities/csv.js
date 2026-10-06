// Opportunités : préparation et téléchargement de l'export CSV.

const opportunityCsvHeaders = [
  "Opportunité",
  "Client / prospect",
  "Origine",
  "Étape",
  "Montant potentiel HT",
  "Probabilité",
  "Prévision pondérée HT",
  "Clôture estimée",
  "Notes"
];

function getOpportunityCsvRows(opportunities) {
  return [opportunityCsvHeaders, ...opportunities.map(item => {
    const amount = Number(item.amount || 0);
    const probability = Number(item.probability || 0);
    return [
      item.title,
      opportunityContactName(item),
      item.source || "manual",
      opportunityStages[item.stage] || item.stage,
      amount,
      `${probability} %`,
      amount * probability / 100,
      item.expectedCloseDate ? new Date(item.expectedCloseDate).toLocaleDateString("fr-FR") : "",
      item.notes || ""
    ];
  })];
}

function exportOpportunitiesCsv() {
  downloadCsvFile(getOpportunityCsvRows(allOpportunities), "pipeline-commercial");
}
