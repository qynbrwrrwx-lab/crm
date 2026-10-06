// Documents commerciaux : delivery. Voir README.md pour les responsabilités.

async function openDocumentPdf(url, unavailableMessage, shouldLogError = false) {
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!response.ok) throw new Error(unavailableMessage);
    const pdfUrl = URL.createObjectURL(await response.blob());
    window.open(pdfUrl, "_blank", "noopener");
    window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
  } catch (err) {
    if (shouldLogError) console.error(err);
    showToast(err.message || unavailableMessage);
  }
}

async function sendDocumentEmail(id) {
  if (!await confirmAppAction({ title: "Envoyer ce document ?", message: "Le document et son PDF seront envoyés à l’adresse e-mail du client.", actionLabel: "Envoyer l’e-mail" })) return;
  const lockKey = `email:${id}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  setDocumentActionPending(id, "email", true, "Envoi en cours…");

  try {
    await apiFetch(`/api/invoices/${id}/send-email`, { method: "POST" });
    await refreshInvoiceListAndCurrentDetail(id);
    showToast("E-mail remis au serveur d’envoi ✅");
  } catch (err) {
    console.error(err);
    showToast(err.message || "Erreur lors de l'envoi de l'email");
  } finally {
    documentActionLocks.delete(lockKey);
    setDocumentActionPending(id, "email", false);
  }
}

async function openPaymentReminder(id) {
  const invoice = allInvoices.find(document => document._id === id);
  const email = invoice?.contactId?.email;
  if (!invoice || !email) return showToast("L’adresse e-mail du client est manquante");
  if (!await confirmAppAction({ title: "Envoyer la relance ?", message: `Une relance sera envoyée directement à ${email}.`, actionLabel: "Envoyer la relance" })) return;
  const lockKey = `reminder:${id}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  try {
    await apiFetch(`/api/invoices/${id}/send-reminder`, { method: "POST" });
    await refreshInvoiceListAndCurrentDetail(id);
    showToast("Relance envoyée ✅");
  } catch (err) { showToast(err.message || "Impossible d’envoyer la relance"); }
  finally { documentActionLocks.delete(lockKey); }
}

async function viewQuote(id) {
  await openDocumentPdf(`${API_URL}/api/invoices/pdf/${id}`, "Impossible de générer le PDF", true);
}

async function openDeliveryNote(id) {
  await openDocumentPdf(`${API_URL}/api/invoices/${id}/delivery-note`, "Impossible de générer le bon de livraison");
}

async function sendDeliveryNote(id) {
  if (!await confirmAppAction({ title: "Envoyer le bon de livraison", message: "Le PDF sera envoyé à l’adresse e-mail du client.", actionLabel: "Envoyer" })) return;
  try { await apiFetch(`/api/invoices/${id}/send-delivery-note`, { method: "POST" }); showToast("Bon de livraison envoyé ✅"); }
  catch (err) { showToast(err.message || "Impossible d’envoyer le bon de livraison"); }
}
