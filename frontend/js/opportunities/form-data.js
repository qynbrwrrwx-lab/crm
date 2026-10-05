// Opportunités : données du formulaire.

function getOpportunityFormData() {
  const value = id => document.getElementById(id).value;
  return {
    title: value("opportunityTitle").trim(),
    contactId: value("opportunityContact") || null,
    amount: value("opportunityAmount") || 0,
    probability: value("opportunityProbability") || 0,
    source: value("opportunitySource"),
    stage: value("opportunityStage"),
    lostReason: value("opportunityLostReason"),
    expectedCloseDate: value("opportunityCloseDate") || null,
    notes: value("opportunityNotes").trim()
  };
}
