// Clients : actions. Voir README.md.

async function deleteContact(id) {
  if (!await confirmAppAction({ title: "Supprimer ce client ?", message: "Cette suppression est définitive. Les documents existants resteront protégés.", actionLabel: "Supprimer le client", danger: true })) return;

  try {
    await apiFetch(`/api/contacts/${id}`, { method: "DELETE" });
    await loadContacts();
    await loadInvoiceData();
    showToast("Contact supprimé 🗑️");
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
