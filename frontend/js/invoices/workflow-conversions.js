// Documents commerciaux : conversions de devis et commandes.

async function convertQuoteToOrder(id) {

  if (!await confirmAppAction({
    title: "Créer la commande ?",
    message: "Une commande sera créée à partir de ce devis accepté. Cette conversion ne peut être effectuée qu’une seule fois.",
    actionLabel: "Créer la commande"
  })) return;

  const lockKey = `quote-to-order:${id}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  setDocumentActionPending(id, "quote-to-order", true, "Création…");

  try {

    const order =
      await apiFetch(
        `/api/invoices/convert-to-order/${id}`,
        {
          method: "POST"
        }
      );

    showToast(
      `Commande ${order.invoiceNumber} créée ✅`
    );

    // Actualiser la liste des documents
    await loadInvoices();

    await openInvoice(order._id);

  } catch (err) {

    console.error(err);

    showToast(
      err.message ||
      "Erreur lors de la transformation en commande"
    );

  } finally {
    documentActionLocks.delete(lockKey);
    setDocumentActionPending(id, "quote-to-order", false);

  }

}

async function convertOrderToInvoice(id) {

  if (!await confirmAppAction({
    title: "Émettre la facture ?",
    message: "Une facture sera créée depuis cette commande. Elle sera verrouillée après son émission.",
    actionLabel: "Émettre la facture"
  })) return;

  const lockKey = `order-to-invoice:${id}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  setDocumentActionPending(id, "order-to-invoice", true, "Émission…");

  try {

    const invoice =
      await apiFetch(
        `/api/invoices/convert-to-invoice/${id}`,
        {
          method: "POST"
        }
      );

    showToast(
      `Facture ${invoice.invoiceNumber} créée ✅`
    );

    await loadInvoices();

    await openInvoice(invoice._id);

  } catch (err) {

    console.error(err);

    showToast(
      err.message ||
      "Erreur lors de la transformation de la commande en facture"
    );

  } finally {
    documentActionLocks.delete(lockKey);
    setDocumentActionPending(id, "order-to-invoice", false);

  }

}
