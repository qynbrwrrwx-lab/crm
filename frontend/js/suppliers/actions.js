// suppliers : actions.

function getRestockRequestPresentation(supplier, productCount) {
  const productLabel = `${productCount} produit${productCount > 1 ? "s" : ""}`;
  return {
    confirmation: {
      title: "Envoyer la demande de réassort",
      message: `Envoyer par e-mail la liste des produits à réassortir à ${supplier.name} ?`,
      actionLabel: "Envoyer"
    },
    successMessage: `Demande de réassort envoyée pour ${productLabel}.`
  };
}

function getSupplierDeletionPresentation() {
  return {
    confirmation: {
      title: "Supprimer le fournisseur",
      message: "Cette suppression est définitive.",
      actionLabel: "Supprimer",
      danger: true
    },
    successMessage: "Fournisseur supprimé"
  };
}

async function sendRestockRequest(id) {
  const supplier = allSuppliers.find(item => item._id === id);
  if (!supplier) return;
  const presentation = getRestockRequestPresentation(supplier, 0);
  const confirmed = await confirmAppAction(presentation.confirmation);
  if (!confirmed) return;
  try {
    const result = await apiFetch(`/api/suppliers/${id}/send-restock-request`, { method: "POST" });
    showToast(getRestockRequestPresentation(supplier, result.count).successMessage);
    await loadSuppliers();
  } catch (error) { showToast(error.message || "Impossible d’envoyer la demande de réassort"); }
}

async function deleteSupplier(id) {
  const presentation = getSupplierDeletionPresentation();
  const confirmed = await confirmAppAction(presentation.confirmation);
  if (!confirmed) return;
  try { await apiFetch(`/api/suppliers/${id}`, { method: "DELETE" }); showToast(presentation.successMessage); await loadSuppliers(); } catch (error) { showToast(error.message || "Impossible de supprimer le fournisseur"); }
}
