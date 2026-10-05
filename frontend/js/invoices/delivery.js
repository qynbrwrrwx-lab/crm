// Documents commerciaux : delivery. Voir README.md pour les responsabilités.

async function sendDocumentEmail(id) {
  if (!await confirmAppAction({ title: "Envoyer ce document ?", message: "Le document et son PDF seront envoyés à l’adresse e-mail du client.", actionLabel: "Envoyer l’e-mail" })) return;
  const lockKey = `email:${id}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  setDocumentActionPending(id, "email", true, "Envoi en cours…");

  try {
    await apiFetch(`/api/invoices/${id}/send-email`, { method: "POST" });
    await loadInvoices();
    if (currentInvoiceId === id) await openInvoice(id);
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
  const client = invoice.contactId?.companyName || `${invoice.contactId?.firstname || ""} ${invoice.contactId?.lastname || ""}`.trim() || "Madame, Monsieur";
  const dueDate = invoice.paymentDueDate ? new Date(invoice.paymentDueDate).toLocaleDateString("fr-FR") : "l’échéance prévue";
  const subject = `Rappel de règlement — facture ${invoice.invoiceNumber}`;
  const body = `Bonjour ${client},\n\nSauf erreur de notre part, la facture ${invoice.invoiceNumber} d’un montant de ${formatDocumentCurrency(invoice.totalTTC)} était à régler pour le ${dueDate}.\n\nNous vous remercions de bien vouloir procéder au règlement ou de nous contacter si celui-ci a déjà été effectué.\n\nCordialement`;
  if (!await confirmAppAction({ title: "Envoyer la relance ?", message: `Une relance sera envoyée directement à ${email}.`, actionLabel: "Envoyer la relance" })) return;
  const lockKey = `reminder:${id}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  try {
    await apiFetch(`/api/invoices/${id}/send-reminder`, { method: "POST" });
    await loadInvoices();
    if (currentInvoiceId === id) await openInvoice(id);
    showToast("Relance envoyée ✅");
  } catch (err) { showToast(err.message || "Impossible d’envoyer la relance"); }
  finally { documentActionLocks.delete(lockKey); }
}

async function viewQuote(id) {

  try {
    const response = await fetch(
      `${API_URL}/api/invoices/pdf/${id}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      }
    );

    if (!response.ok) {
      throw new Error("Impossible de générer le PDF");
    }

    const pdfUrl = URL.createObjectURL(await response.blob());
    window.open(pdfUrl, "_blank", "noopener");
    window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);

  } catch (err) {
    console.error(err);
    showToast(err.message);
  }

}

async function openDeliveryNote(id) {
  try {
    const response = await fetch(`${API_URL}/api/invoices/${id}/delivery-note`, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!response.ok) throw new Error("Impossible de générer le bon de livraison");
    const url = URL.createObjectURL(await response.blob());
    window.open(url, "_blank", "noopener");
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (err) { showToast(err.message || "Impossible d’ouvrir le bon de livraison"); }
}

async function sendDeliveryNote(id) {
  if (!await confirmAppAction({ title: "Envoyer le bon de livraison", message: "Le PDF sera envoyé à l’adresse e-mail du client.", actionLabel: "Envoyer" })) return;
  try { await apiFetch(`/api/invoices/${id}/send-delivery-note`, { method: "POST" }); showToast("Bon de livraison envoyé ✅"); }
  catch (err) { showToast(err.message || "Impossible d’envoyer le bon de livraison"); }
}
