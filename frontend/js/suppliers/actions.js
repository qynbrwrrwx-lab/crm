// suppliers : actions.

async function sendRestockRequest(id) {
  const supplier = allSuppliers.find(item => item._id === id);
  if (!supplier) return;
  const confirmed = await confirmAppAction({ title: "Envoyer la demande de réassort", message: `Envoyer par e-mail la liste des produits à réassortir à ${supplier.name} ?`, actionLabel: "Envoyer" });
  if (!confirmed) return;
  try { const result = await apiFetch(`/api/suppliers/${id}/send-restock-request`, { method: "POST" }); showToast(`Demande de réassort envoyée pour ${result.count} produit${result.count > 1 ? "s" : ""}.`); await loadSuppliers(); } catch (error) { showToast(error.message || "Impossible d’envoyer la demande de réassort"); }
}

async function deleteSupplier(id) {
  const confirmed = await confirmAppAction({ title: "Supprimer le fournisseur", message: "Cette suppression est définitive.", actionLabel: "Supprimer", danger: true });
  if (!confirmed) return;
  try { await apiFetch(`/api/suppliers/${id}`, { method: "DELETE" }); showToast("Fournisseur supprimé"); await loadSuppliers(); } catch (error) { showToast(error.message || "Impossible de supprimer le fournisseur"); }
}
