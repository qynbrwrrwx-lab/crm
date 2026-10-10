// HTML d’une ligne de document commercial.
function getInvoiceListRowDate(invoice) {
  const date = new Date(invoice.createdAt);
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date.toLocaleString("fr-FR", { month: "short" })
  };
}

function getInvoiceListCustomerName(invoice) {
  return invoice.contactId?.companyName
    || `${invoice.contactId?.firstname || ""} ${invoice.contactId?.lastname || ""}`.trim();
}

function getInvoicePaymentPresentation(invoice) {
  const dueState = getInvoiceDueState(invoice);
  if (invoice.paymentStatus === "paid") {
    return { className: "paid", label: `Payée · ${escapeHtml(getPaymentMethodLabel(invoice.paymentMethod))}` };
  }
  if (invoice.paymentStatus === "partial") return { className: "due-soon", label: "Partiellement réglée" };
  return { className: dueState?.kind || "pending", label: dueState?.label || "En attente" };
}

function getInvoiceDocumentPresentation(invoice, payment) {
  if (invoice.type === "quote") {
    return invoice.status === "accepted"
      ? { className: "accepted", label: "Devis accepté" }
      : invoice.status === "declined"
        ? { className: "overdue", label: "Devis refusé" }
        : { className: "draft", label: "Devis en attente" };
  }
  if (invoice.type === "order") {
    return { className: invoice.convertedToInvoiceId ? "completed" : "pending", label: `${orderFulfillmentLabel(invoice)}${invoice.convertedToInvoiceId ? " · Facturée" : ""}` };
  }
  if (invoice.type === "credit_note") return { className: "completed", label: "Avoir émis" };
  return payment;
}

function getInvoiceListRowPresentation(invoice) {
  const payment = getInvoicePaymentPresentation(invoice);
  return {
    ...getInvoiceListRowDate(invoice),
    customerName: getInvoiceListCustomerName(invoice),
    articlesCount: invoice.products?.length || 0,
    payment,
    document: getInvoiceDocumentPresentation(invoice, payment),
    electronicTransmission: getElectronicTransmissionPresentation(invoice)
  };
}

function renderInvoiceListRow(invoice) {
    const presentation = getInvoiceListRowPresentation(invoice);


    const html = `

      <div
        class="erp-row"
        onclick="openInvoice('${invoice._id}')"
      >

        <div class="erp-date">

          <div class="erp-day">
            ${presentation.day}
          </div>

          <div class="erp-month">
            ${presentation.month}
          </div>

        </div>


        <div class="erp-customer">

          <div class="erp-number">
            ${escapeHtml(invoice.invoiceNumber)}
          </div>

          <div class="erp-name">
            ${escapeHtml(presentation.customerName)}
          </div>

          <div class="erp-items">
            ${presentation.articlesCount}
            article${presentation.articlesCount > 1 ? "s" : ""}
          </div>

          <span class="document-status ${presentation.document.className}">
            ${presentation.document.label}
          </span>

          ${presentation.electronicTransmission ? `
            <span class="electronic-invoice-badge ${presentation.electronicTransmission.className}">
              ${presentation.electronicTransmission.label}
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
              ? `<span class="invoice-status ${presentation.payment.className}">${presentation.payment.label}</span>`
              : ""
          }

        </div>

      </div>

    `;


  return html;
}
