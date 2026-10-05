// Documents commerciaux : chronologie de la fiche de détail.

function getInvoiceTimelineSteps(invoice) {
  const createdDate = new Date(invoice.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short"
  });

  const timelineSteps = invoice.type === "quote"
    ? [
        { label: "Devis créé", detail: createdDate, complete: true },
        { label: "Décision client", detail: invoice.status === "accepted" ? "Accepté" : "En attente", complete: invoice.status === "accepted" },
        { label: "Commande", detail: invoice.convertedToOrderId ? "Créée" : "À venir", complete: Boolean(invoice.convertedToOrderId) }
      ]
    : invoice.type === "order"
      ? [
          { label: "Commande créée", detail: createdDate, complete: true },
          { label: "Préparation", detail: "Confirmée", complete: true },
          { label: "Facturation", detail: invoice.convertedToInvoiceId ? "Facture créée" : "À créer", complete: Boolean(invoice.convertedToInvoiceId) }
        ]
      : invoice.type === "invoice"
        ? [
            { label: "Facture émise", detail: createdDate, complete: true },
            { label: "Règlement", detail: invoice.paymentStatus === "paid" ? "Reçu" : "En attente", complete: invoice.paymentStatus === "paid" },
            { label: "Suivi", detail: invoice.paymentStatus === "paid" ? "Terminé" : "À encaisser", complete: invoice.paymentStatus === "paid" }
          ]
        : [
            { label: "Avoir émis", detail: createdDate, complete: true },
            { label: "Document lié", detail: invoice.sourceDocumentId?.invoiceNumber || "Facture d’origine", complete: true }
          ];

  return timelineSteps;
}
