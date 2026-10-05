// HTML d’une ligne de document commercial.
function renderInvoiceListRow(invoice) {

    const date =
      new Date(invoice.createdAt);


    const day =
      String(
        date.getDate()
      ).padStart(2, "0");


    const month =
      date.toLocaleString(
        "fr-FR",
        {
          month: "short"
        }
      );


    const customerName =
      invoice.contactId?.companyName ||
      `${invoice.contactId?.firstname || ""}
       ${invoice.contactId?.lastname || ""}`;

    const articlesCount =
      invoice.products?.length || 0;

    const dueState = getInvoiceDueState(invoice);
    const invoiceStatusClass = invoice.paymentStatus === "paid"
      ? "paid"
      : invoice.paymentStatus === "partial"
      ? "due-soon"
      : dueState?.kind || "pending";
    const invoiceStatusLabel = invoice.paymentStatus === "paid"
      ? `Payée · ${escapeHtml(getPaymentMethodLabel(invoice.paymentMethod))}`
      : invoice.paymentStatus === "partial"
      ? "Partiellement réglée"
      : dueState?.label || "En attente";
    const electronicTransmission = getElectronicTransmissionPresentation(invoice);


    const html = `

      <div
        class="erp-row"
        onclick="openInvoice('${invoice._id}')"
      >

        <div class="erp-date">

          <div class="erp-day">
            ${day}
          </div>

          <div class="erp-month">
            ${month}
          </div>

        </div>


        <div class="erp-customer">

          <div class="erp-number">
            ${escapeHtml(invoice.invoiceNumber)}
          </div>

          <div class="erp-name">
            ${escapeHtml(customerName)}
          </div>

          <div class="erp-items">
            ${articlesCount}
            article${articlesCount > 1 ? "s" : ""}
          </div>

          <span class="document-status ${
            invoice.type === "quote"
              ? (invoice.status === "accepted" ? "accepted" : invoice.status === "declined" ? "overdue" : "draft")
              : invoice.type === "order"
              ? (invoice.convertedToInvoiceId ? "completed" : "pending")
              : invoice.type === "credit_note"
              ? "completed"
              : invoiceStatusClass
          }">
            ${
              invoice.type === "quote"
                ? (invoice.status === "accepted" ? "Devis accepté" : invoice.status === "declined" ? "Devis refusé" : "Devis en attente")
                : invoice.type === "order"
                ? `${orderFulfillmentLabel(invoice)}${invoice.convertedToInvoiceId ? " · Facturée" : ""}`
                : invoice.type === "credit_note"
                ? "Avoir émis"
                : invoiceStatusLabel
            }
          </span>

          ${electronicTransmission ? `
            <span class="electronic-invoice-badge ${electronicTransmission.className}">
              ${electronicTransmission.label}
            </span>
          ` : ""}

        </div>


        <div class="erp-amounts">

          <div>
            ${formatDocumentNumber(invoice.totalTTC)}
            €
            TTC
          </div>

          <small>
            ${formatDocumentNumber(invoice.totalHT)}
            €
            HT
          </small>

          ${
            invoice.type === "invoice"
              ? `<span class="invoice-status ${
                  invoiceStatusClass
                }">${invoiceStatusLabel}</span>`
              : ""
          }

        </div>

      </div>

    `;


  return html;
}
