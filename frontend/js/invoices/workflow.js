// Documents commerciaux : workflow. Voir README.md pour les responsabilités.

function getQuoteDuplicationPresentation(invoiceNumber = "") {
  return {
    confirmation: {
      title: "Dupliquer ce devis ?",
      message: "Un nouveau devis brouillon sera créé avec les mêmes lignes. Vous pourrez ensuite le modifier avant envoi.",
      actionLabel: "Dupliquer le devis"
    },
    successMessage: `Devis ${invoiceNumber} créé à partir du modèle ✅`
  };
}

function getDocumentDeletionPresentation() {
  return {
    confirmation: {
      title: "Supprimer ce devis ?",
      message: "Cette suppression est définitive. Les devis déjà convertis restent protégés.",
      actionLabel: "Supprimer le devis",
      danger: true
    },
    successMessage: "Document supprimé 🗑️"
  };
}

function getQuoteAcceptancePresentation() {
  return {
    confirmation: {
      title: "Accepter ce devis ?",
      message: "Le devis sera verrouillé et pourra ensuite être transformé en commande.",
      actionLabel: "Accepter le devis"
    },
    successMessage: "Devis accepté et verrouillé ✅"
  };
}

function getOrderFulfillmentPresentation(status) {
  const labels = { prepared: "marquer comme préparée", shipped: "marquer comme expédiée", delivered: "marquer comme livrée" };
  return {
    confirmation: {
      title: "Mettre à jour la commande",
      message: `Voulez-vous ${labels[status] || "mettre à jour cette commande"} ?`,
      actionLabel: "Confirmer"
    },
    successMessage: "Suivi de commande mis à jour ✅"
  };
}

async function duplicateQuote(id) {
  const presentation = getQuoteDuplicationPresentation();
  if (!await confirmAppAction(presentation.confirmation)) return;

  const lockKey = `duplicate-quote:${id}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  try {
    const duplicate = await apiFetch(`/api/invoices/duplicate-quote/${id}`, { method: "POST" });
    await loadInvoices();
    showToast(getQuoteDuplicationPresentation(duplicate.invoiceNumber).successMessage);
    await openInvoice(duplicate._id);
  } catch (err) {
    showToast(err.message || "Impossible de dupliquer ce devis");
  } finally {
    documentActionLocks.delete(lockKey);
  }
}

async function deleteInvoice(id) {
  const presentation = getDocumentDeletionPresentation();
  if (!await confirmAppAction(presentation.confirmation)) return;
  const lockKey = `delete:${id}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  try {
    await apiFetch(`/api/invoices/${id}`, { method: "DELETE" });
    await loadInvoices();
    showToast(presentation.successMessage);
  } catch (err) {
    console.error(err);
    showToast(err.message || "Impossible de supprimer le document");
  } finally {
    documentActionLocks.delete(lockKey);
  }
}

async function acceptQuote(id) {
  const presentation = getQuoteAcceptancePresentation();
  if (!await confirmAppAction(presentation.confirmation)) return;

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

    showToast(presentation.successMessage);

  } catch (err) {

    console.error(err);

    showToast(err.message);

  } finally {
    documentActionLocks.delete(lockKey);
    setDocumentActionPending(id, "accept", false);

  }
}

async function updateOrderFulfillment(id, status) {
  const presentation = getOrderFulfillmentPresentation(status);
  if (!await confirmAppAction(presentation.confirmation)) return;
  const lockKey = `fulfillment:${id}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  try {
    await apiFetch(`/api/invoices/${id}/fulfillment-status`, { method: "PUT", body: JSON.stringify({ status }) });
    await loadInvoiceData();
    showToast(presentation.successMessage);
  } catch (err) {
    showToast(err.message || "Impossible de mettre à jour la commande");
  } finally {
    documentActionLocks.delete(lockKey);
  }
}
