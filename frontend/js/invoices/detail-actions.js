// Documents commerciaux : actions de la fiche de détail.

function renderInvoiceDetailActions(invoice, isEditingQuote, linkedDocument) {
  return `    <div class="invoice-detail-actions">

    <button
      type="button"
      class="secondary-btn document-pdf-action"
      onclick="viewQuote('${invoice._id}')"
    >
      Aperçu PDF
    </button>

    ${linkedDocument?.id ? `
      <button
        type="button"
        class="secondary-btn document-linked-action"
        onclick="openInvoice('${linkedDocument.id}')"
      >
        ${linkedDocument.label}
      </button>
    ` : ""}

    ${
      ["quote", "order", "invoice", "credit_note"].includes(invoice.type)
      ? invoice.contactId?.email ? `
        <button
          class="secondary-btn"
          data-document-action="email"
          data-document-id="${invoice._id}"
          onclick="sendDocumentEmail('${invoice._id}')"
        >
          Envoyer par email
        </button>
      ` : `
        <button class="secondary-btn document-email-disabled" type="button" disabled title="Ajoutez l’adresse e-mail dans la fiche du client">
          Adresse e-mail manquante
        </button>
        ${invoice.contactId?._id ? `<button class="secondary-btn document-contact-fix-action" type="button" onclick="editContactFromDocument('${invoice.contactId._id}')">Compléter le client</button>` : ""}
      `
      : ""
    }

    ${
    invoice.type === "quote" &&
    invoice.status !== "accepted"
    ? `
      <button
        class="primary-btn"
        data-document-action="accept"
        data-document-id="${invoice._id}"
        onclick="acceptQuote('${invoice._id}')"
      >
        Accepter le devis
      </button>
    `
    : ""
}

    ${
      invoice.type === "quote"
      ? `
        <button
          type="button"
          class="secondary-btn"
          data-document-action="duplicate-quote"
          data-document-id="${invoice._id}"
          onclick="duplicateQuote('${invoice._id}')"
        >
          Dupliquer
        </button>
      `
      : ""
    }

    ${
    invoice.type === "order"
    ? `<button class="secondary-btn" onclick="openDeliveryNote('${invoice._id}')">Bon de livraison</button><button class="secondary-btn" onclick="sendDeliveryNote('${invoice._id}')">Envoyer le bon</button>`
    : ""
}

    ${
    invoice.type === "order" && invoice.fulfillmentStatus !== "delivered"
    ? `
      <button class="secondary-btn" onclick="updateOrderFulfillment('${invoice._id}','${invoice.fulfillmentStatus === "to_prepare" ? "prepared" : invoice.fulfillmentStatus === "prepared" ? "shipped" : "delivered"}')">
        ${invoice.fulfillmentStatus === "to_prepare" ? "Marquer préparée" : invoice.fulfillmentStatus === "prepared" ? "Marquer expédiée" : "Marquer livrée"}
      </button>
    `
    : ""
}

    ${
    invoice.type === "order" &&
    !invoice.convertedToInvoiceId
    ? `
      <button
        class="primary-btn"
        data-document-action="order-to-invoice"
        data-document-id="${invoice._id}"
        onclick="convertOrderToInvoice('${invoice._id}')"
      >
        Transformer en facture
      </button>
    `
    : ""
}

    ${
    invoice.type === "quote" &&
    invoice.status === "accepted"
    ? `
      <button class="secondary-btn" onclick="createDepositInvoice('${invoice._id}')">
        Créer une facture d’acompte
      </button>
    `
    : ""
}

    ${
    invoice.type === "quote" &&
    invoice.status === "accepted" &&
    !invoice.convertedToOrderId
    ? `
      <button
        class="primary-btn"
        data-document-action="quote-to-order"
        data-document-id="${invoice._id}"
        onclick="convertQuoteToOrder('${invoice._id}')"
      >
        Transformer en commande
      </button>
    `
    : ""
}

     ${
  invoice.type === "quote" &&
  invoice.status !== "accepted"
  ? `
    <button
      id="editInvoiceBtn"
      class="primary-btn"
      onclick="
      ${
          isEditingQuote
          ? `saveInvoiceEdition()`
          : `enableInvoiceEdition()`
      }
      "
    >
      ${
          isEditingQuote
          ? "Enregistrer"
          : "Modifier"
      }
    </button>

    <details class="document-more-actions">
      <summary>Plus d’actions</summary>
      <div class="document-more-actions-menu">
        <button
          type="button"
          onclick="deleteInvoice('${invoice._id}')"
        >
          Supprimer ce devis
        </button>
      </div>
    </details>
  `
  : ""
}

${
  invoice.type === "invoice" &&
  invoice.paymentStatus !== "paid"
  ? `
    <button
      class="primary-btn"
      onclick="markInvoicePaid('${invoice._id}')"
    >
      Marquer comme payée
    </button>
  `
  : ""
}

${
  invoice.type === "invoice" &&
  invoice.paymentStatus === "paid"
  ? `
    <span class="invoice-paid-badge">
      Payée${
        invoice.paymentMethod
          ? ` · ${escapeHtml(invoice.paymentMethod)}`
          : ""
      }
    </span>
  `
  : ""
}

${
    invoice.type === "invoice" && !invoice.creditNoteId
  ? `<button class="secondary-btn" data-document-action="credit-note" data-document-id="${invoice._id}" onclick="createCreditNote('${invoice._id}')">Créer un avoir</button>`
  : ""
}

${invoice.type === "invoice" && getInvoiceDueState(invoice)?.kind === "overdue" && invoice.contactId?.email
  ? `<button class="secondary-btn document-contact-fix-action" onclick="openPaymentReminder('${invoice._id}')">${invoice.paymentReminderSentAt ? `Renvoyer la relance · ${formatDocumentEmailDate(invoice.paymentReminderSentAt)}` : "Envoyer une relance"}</button>`
  : ""}

    </div>`;
}
