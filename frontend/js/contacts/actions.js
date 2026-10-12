// Clients : actions. Voir README.md.

function getContactDeletionPresentation() {
  return {
    confirmation: {
      title: "Supprimer ce client ?",
      message: "Cette suppression est définitive. Les documents existants resteront protégés.",
      actionLabel: "Supprimer le client",
      danger: true
    },
    successMessage: "Contact supprimé 🗑️"
  };
}

async function deleteContact(id) {
  const presentation = getContactDeletionPresentation();
  if (!await confirmAppAction(presentation.confirmation)) return;

  try {
    await apiFetch(`/api/contacts/${id}`, { method: "DELETE" });
    await loadContacts();
    await loadInvoiceData();
    showToast(presentation.successMessage);
  } catch (err) {
    showToast(err.message || "Impossible de supprimer ce contact");
  }
}

async function toggleFavorite(id) {

  await apiFetch(
  `/api/contacts/favorite/${id}`,
    {
      method: "PUT"
    }
  );

  loadContacts();
}
