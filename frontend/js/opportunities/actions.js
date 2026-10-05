// Opportunités : actions entre le pipeline, l'agenda et les devis.

function getOpportunityContactId(contact) {
  return contact?._id || contact || "";
}

function createOpportunityFollowUp(opportunity) {
  showSection("tasksSection");
  resetTaskForm();

  const contact = document.getElementById("taskContact");
  if (contact) contact.value = getOpportunityContactId(opportunity.contactId);

  document.getElementById("taskTitle").value = `Relancer : ${opportunity.title}`;
  document.getElementById("taskPriority").value = opportunity.stage === "proposal" ? "high" : "normal";
  document.getElementById("taskDueDate").value = new Date().toISOString().slice(0, 10);
  document.getElementById("taskForm").scrollIntoView({ behavior: "smooth", block: "start" });
  showToast("Relance préparée dans l’Agenda.");
}

async function moveOpportunity(id, stage) {
  if (!stage) return;

  try {
    await apiFetch(`/api/opportunities/${id}/stage`, {
      method: "PUT",
      body: JSON.stringify({ stage })
    });
    showToast("Étape mise à jour");
    await loadOpportunities();
  } catch (error) {
    showToast(error.message);
  }
}

async function createQuoteFromOpportunity(id) {
  const opportunity = allOpportunities.find(item => item._id === id);
  if (!opportunity?.contactId) {
    showToast("Associez d’abord un client à cette opportunité.");
    return;
  }

  showSection("quotesSection");
  const modal = document.getElementById("quoteModal");
  if (modal?.hidden || modal?.style.display === "none") await toggleQuoteForm();

  const contact = document.getElementById("quoteContact");
  if (contact) {
    contact.value = getOpportunityContactId(opportunity.contactId);
    if (typeof updateQuoteClientContext === "function") updateQuoteClientContext();
  }
  showToast("Client repris dans le nouveau devis.");
}

async function deleteOpportunity(id) {
  const confirmed = await confirmAppAction({
    title: "Supprimer l’opportunité",
    message: "Cette action est définitive.",
    actionLabel: "Supprimer",
    danger: true
  });
  if (!confirmed) return;

  try {
    await apiFetch(`/api/opportunities/${id}`, { method: "DELETE" });
    await loadOpportunities();
  } catch (error) {
    showToast(error.message);
  }
}
