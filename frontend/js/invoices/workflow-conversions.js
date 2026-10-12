// Documents commerciaux : conversions de devis et commandes.

function getDocumentConversionPresentation(kind, invoiceNumber = "") {
  if (kind === "quote-to-order") {
    return {
      confirmation: {
        title: "Créer la commande ?",
        message: "Une commande sera créée à partir de ce devis accepté. Cette conversion ne peut être effectuée qu’une seule fois.",
        actionLabel: "Créer la commande"
      },
      pendingLabel: "Création…",
      successMessage: `Commande ${invoiceNumber} créée ✅`
    };
  }
  return {
    confirmation: {
      title: "Émettre la facture ?",
      message: "Une facture sera créée depuis cette commande. Elle sera verrouillée après son émission.",
      actionLabel: "Émettre la facture"
    },
    pendingLabel: "Émission…",
    successMessage: `Facture ${invoiceNumber} créée ✅`
  };
}

async function convertQuoteToOrder(id) {
  const presentation = getDocumentConversionPresentation("quote-to-order");
  if (!await confirmAppAction(presentation.confirmation)) return;

  const lockKey = `quote-to-order:${id}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  setDocumentActionPending(id, "quote-to-order", true, presentation.pendingLabel);

  try {

    const order =
      await apiFetch(
        `/api/invoices/convert-to-order/${id}`,
        {
          method: "POST"
        }
      );

    showToast(getDocumentConversionPresentation("quote-to-order", order.invoiceNumber).successMessage);

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
  const presentation = getDocumentConversionPresentation("order-to-invoice");
  if (!await confirmAppAction(presentation.confirmation)) return;

  const lockKey = `order-to-invoice:${id}`;
  if (documentActionLocks.has(lockKey)) return;
  documentActionLocks.add(lockKey);
  setDocumentActionPending(id, "order-to-invoice", true, presentation.pendingLabel);

  try {

    const invoice =
      await apiFetch(
        `/api/invoices/convert-to-invoice/${id}`,
        {
          method: "POST"
        }
      );

    showToast(getDocumentConversionPresentation("order-to-invoice", invoice.invoiceNumber).successMessage);

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
