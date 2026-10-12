// Trésorerie : form.

function getTreasuryFormActionPresentation(isEditing = false) {
  return {
    settings: {
      invalidMessage: "Renseignez un solde, une réserve et une date valides",
      successMessage: "Paramètres de trésorerie mis à jour"
    },
    entry: {
      invalidMessage: "Vérifiez le libellé, le montant et la date",
      successMessage: isEditing ? "Mouvement mis à jour" : "Mouvement ajouté"
    },
    deletion: {
      confirmation: {
        title: "Supprimer le mouvement",
        message: "Cette suppression est définitive.",
        actionLabel: "Supprimer",
        danger: true
      },
      successMessage: "Mouvement supprimé"
    }
  };
}

async function saveTreasurySettings(event) {
  event.preventDefault();
  const presentation = getTreasuryFormActionPresentation();
  const { openingBalance, minimumBalance, openingBalanceDate } = readTreasurySettingsForm();
  if (!Number.isFinite(openingBalance) || !Number.isFinite(minimumBalance) || minimumBalance < 0 || !openingBalanceDate) return showToast(presentation.settings.invalidMessage);
  try { await apiFetch("/api/treasury/settings", { method: "PUT", body: JSON.stringify({ openingBalance, minimumBalance, openingBalanceDate }) }); showToast(presentation.settings.successMessage); await loadTreasury(); } catch (error) { showToast(error.message || "Impossible de mettre à jour le solde"); }
}

async function saveTreasuryEntry(event) {
  event.preventDefault();
  const isEditing = Boolean(editingTreasuryEntryId);
  const presentation = getTreasuryFormActionPresentation(isEditing);
  const { label, amount, type, date } = readTreasuryEntryForm();
  if (!label || !Number.isFinite(amount) || amount <= 0 || !date) return showToast(presentation.entry.invalidMessage);
  try {
    const endpoint = isEditing ? `/api/treasury/entries/${editingTreasuryEntryId}` : "/api/treasury/entries";
    await apiFetch(endpoint, { method: isEditing ? "PUT" : "POST", body: JSON.stringify({ label, amount, type, date }) });
    cancelTreasuryEntryEdit();
    showToast(presentation.entry.successMessage);
    await loadTreasury();
  } catch (error) { showToast(error.message || "Impossible d'enregistrer le mouvement"); }
}

function editTreasuryEntry(id) {
  const entry = treasuryEntries.find(item => item._id === id);
  if (!entry) return;
  editingTreasuryEntryId = id;
  populateTreasuryEntryForm(entry);
  document.getElementById("treasuryEntryTitle").textContent = "Modifier le mouvement";
  document.getElementById("treasuryEntrySubmitButton").textContent = "Enregistrer les modifications";
  document.getElementById("cancelTreasuryEntryEditButton").hidden = false;
  document.getElementById("treasuryEntryForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function cancelTreasuryEntryEdit() {
  editingTreasuryEntryId = null;
  resetTreasuryEntryForm();
  document.getElementById("treasuryEntryTitle").textContent = "Ajouter une entrée ou sortie";
  document.getElementById("treasuryEntrySubmitButton").textContent = "Ajouter le mouvement";
  document.getElementById("cancelTreasuryEntryEditButton").hidden = true;
}

async function deleteTreasuryEntry(id) {
  const presentation = getTreasuryFormActionPresentation().deletion;
  const confirmed = await confirmAppAction(presentation.confirmation);
  if (!confirmed) return;
  try { await apiFetch(`/api/treasury/entries/${id}`, { method: "DELETE" }); showToast(presentation.successMessage); await loadTreasury(); } catch (error) { showToast(error.message || "Impossible de supprimer le mouvement"); }
}

document.addEventListener("DOMContentLoaded", () => { const field = document.getElementById("treasuryEntryDate"); if (field && !field.value) field.value = new Date().toISOString().slice(0, 10); });
