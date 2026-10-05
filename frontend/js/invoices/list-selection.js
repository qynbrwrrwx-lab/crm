// Sélection, compteurs et tri des documents, sans accès au DOM.
function selectInvoiceList(invoices, filters = {}) {
  const search = String(filters.search || "").trim().toLocaleLowerCase("fr-FR");
  const status = filters.status || "all";
  const electronicStatus = filters.electronicStatus || "all";
  const sort = filters.sort || "recent";
  // ================= DEVIS =================

  const quotes =
    invoices.filter(
      i =>
        i.type === "quote" &&
        i.status !== "accepted"
    );


  // ================= DEVIS ACCEPTÉS =================

  const acceptedQuotes =
    invoices.filter(
      i =>
        i.type === "quote" &&
        i.status === "accepted"
    );


  // ================= COMMANDES =================

  const orders =
    invoices.filter(
      i =>
        i.type === "order"
    );

  const invoiceDocuments = invoices.filter(
    invoice => ["invoice", "credit_note"].includes(invoice.type)
  );

  const visibleInvoiceIds = new Set(
    invoiceDocuments.filter(invoice => {
      const customer = [
        invoice.contactId?.companyName,
        invoice.contactId?.firstname,
        invoice.contactId?.lastname
      ].filter(Boolean).join(" ").toLocaleLowerCase("fr-FR");

      return (
        (!search || invoice.invoiceNumber?.toLocaleLowerCase("fr-FR").includes(search) || customer.includes(search)) &&
        (status === "all" ||
          (status === "overdue" && getInvoiceDueState(invoice)?.kind === "overdue") ||
          (status !== "overdue" && invoice.type === "invoice" && invoice.paymentStatus === status)) &&
        (electronicStatus === "all" || invoice.electronicTransmission?.status === electronicStatus)
      );
    }).map(invoice => invoice._id)
  );

  const paidTotal = invoiceDocuments
    .filter(invoice => invoice.paymentStatus === "paid")
    .reduce((total, invoice) => total + Number(invoice.totalTTC || 0), 0);
  const pendingTotal = invoiceDocuments
    .filter(invoice => invoice.paymentStatus !== "paid")
    .reduce((total, invoice) => total + Number(invoice.totalTTC || 0), 0);
  const electronicReadyCount = invoiceDocuments
    .filter(invoice => invoice.electronicTransmission?.status === "ready")
    .length;

  const sortedInvoices = [...invoices].sort((left, right) => {
    if (sort === "oldest") return new Date(left.createdAt) - new Date(right.createdAt);
    if (sort === "amount-desc") return Number(right.totalTTC || 0) - Number(left.totalTTC || 0);
    if (sort === "amount-asc") return Number(left.totalTTC || 0) - Number(right.totalTTC || 0);
    return new Date(right.createdAt) - new Date(left.createdAt);
  });

  return { quotes, acceptedQuotes, orders, visibleInvoiceIds, paidTotal, pendingTotal, electronicReadyCount, sortedInvoices };
}
