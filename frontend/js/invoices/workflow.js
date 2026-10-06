// Documents commerciaux : workflow. Voir README.md pour les responsabilités.

async function duplicateQuote(id) {
  if (!await confirmAppAction({
    title: "Dupliquer ce devis ?",
    message: "Un nouveau devis brouillon sera créé avec les mêmes lignes. Vous pourrez ensuite le modifier avant envoi.",
    actionLabel: "Dupliquer le devis"
  })) return;

  const lockKey = `duplicate-quote:${id}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  try {
    const duplicate = await apiFetch(`/api/invoices/duplicate-quote/${id}`, { method: "POST" });
    await loadInvoices();
    showToast(`Devis ${duplicate.invoiceNumber} créé à partir du modèle ✅`);
    await openInvoice(duplicate._id);
  } catch (err) {
    showToast(err.message || "Impossible de dupliquer ce devis");
  } finally {
    documentActionLocks.delete(lockKey);
  }
}

async function deleteInvoice(id) {
  if (!await confirmAppAction({ title: "Supprimer ce devis ?", message: "Cette suppression est définitive. Les devis déjà convertis restent protégés.", actionLabel: "Supprimer le devis", danger: true })) return;
  const lockKey = `delete:${id}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  try {
    await apiFetch(`/api/invoices/${id}`, { method: "DELETE" });
    await loadInvoices();
    showToast("Document supprimé 🗑️");
  } catch (err) {
    console.error(err);
    showToast(err.message || "Impossible de supprimer le document");
  } finally {
    documentActionLocks.delete(lockKey);
  }
}

async function acceptQuote(id) {

  if (!await confirmAppAction({
    title: "Accepter ce devis ?",
    message: "Le devis sera verrouillé et pourra ensuite être transformé en commande.",
    actionLabel: "Accepter le devis"
  })) return;

  const lockKey = `accept:${id}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  setDocumentActionPending(id, "accept", true, "Acceptation…");

  try {

    await apiFetch(
      `/api/invoices/accept/${id}`,
      {
        method: "PUT"
      }
    );

    await refreshInvoiceListAndCurrentDetail(id);

    showToast("Devis accepté et verrouillé ✅");

  } catch (err) {

    console.error(err);

    showToast(err.message);

  } finally {
    documentActionLocks.delete(lockKey);
    setDocumentActionPending(id, "accept", false);

  }
}

async function updateOrderFulfillment(id, status) {
  const labels = { prepared: "marquer comme préparée", shipped: "marquer comme expédiée", delivered: "marquer comme livrée" };
  if (!await confirmAppAction({ title: "Mettre à jour la commande", message: `Voulez-vous ${labels[status] || "mettre à jour cette commande"} ?`, actionLabel: "Confirmer" })) return;
  const lockKey = `fulfillment:${id}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  try {
    await apiFetch(`/api/invoices/${id}/fulfillment-status`, { method: "PUT", body: JSON.stringify({ status }) });
    await loadInvoiceData();
    showToast("Suivi de commande mis à jour ✅");
  } catch (err) {
    showToast(err.message || "Impossible de mettre à jour la commande");
  } finally {
    documentActionLocks.delete(lockKey);
  }
}
