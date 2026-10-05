// Trésorerie : form.

async function saveTreasurySettings(event) {
  event.preventDefault();
  const { openingBalance, minimumBalance, openingBalanceDate } = readTreasurySettingsForm();
  if (!Number.isFinite(openingBalance) || !Number.isFinite(minimumBalance) || minimumBalance < 0 || !openingBalanceDate) return showToast("Renseignez un solde, une réserve et une date valides");
  try { await apiFetch("/api/treasury/settings", { method: "PUT", body: JSON.stringify({ openingBalance, minimumBalance, openingBalanceDate }) }); showToast("Paramètres de trésorerie mis à jour"); await loadTreasury(); } catch (error) { showToast(error.message || "Impossible de mettre à jour le solde"); }
}

async function saveTreasuryEntry(event) {
  event.preventDefault();
  const { label, amount, type, date } = readTreasuryEntryForm();
  if (!label || !Number.isFinite(amount) || amount <= 0 || !date) return showToast("Vérifiez le libellé, le montant et la date");
  try { const endpoint = editingTreasuryEntryId ? `/api/treasury/entries/${editingTreasuryEntryId}` : "/api/treasury/entries"; await apiFetch(endpoint, { method: editingTreasuryEntryId ? "PUT" : "POST", body: JSON.stringify({ label, amount, type, date }) }); const wasEditing = Boolean(editingTreasuryEntryId); cancelTreasuryEntryEdit(); showToast(wasEditing ? "Mouvement mis à jour" : "Mouvement ajouté"); await loadTreasury(); } catch (error) { showToast(error.message || "Impossible d'enregistrer le mouvement"); }
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
  const confirmed = await confirmAppAction({ title: "Supprimer le mouvement", message: "Cette suppression est définitive.", actionLabel: "Supprimer", danger: true });
  if (!confirmed) return;
  try { await apiFetch(`/api/treasury/entries/${id}`, { method: "DELETE" }); showToast("Mouvement supprimé"); await loadTreasury(); } catch (error) { showToast(error.message || "Impossible de supprimer le mouvement"); }
}

document.addEventListener("DOMContentLoaded", () => { const field = document.getElementById("treasuryEntryDate"); if (field && !field.value) field.value = new Date().toISOString().slice(0, 10); });
