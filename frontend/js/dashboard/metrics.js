// Calculs purs utilisés par les indicateurs du tableau de bord.
function getBusinessMetrics(invoices, currentDate = new Date()) {
  const quotes = invoices.filter(invoice => invoice.type === "quote" && invoice.status !== "accepted");
  const orders = invoices.filter(invoice => invoice.type === "order");
  const pending = invoices.filter(invoice => invoice.type === "invoice" && invoice.paymentStatus !== "paid");
  const paid = invoices.filter(invoice => invoice.type === "invoice" && invoice.paymentStatus === "paid");
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);
  const overdue = pending.filter(invoice => {
    if (!invoice.paymentDueDate) return false;
    const dueDate = new Date(invoice.paymentDueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });
  const total = values => values.reduce((sum, value) => sum + Number(value.totalTTC || 0), 0);

  return { quotes, orders, pending, paid, overdue, pendingTotal: total(pending), paidTotal: total(paid), overdueTotal: total(overdue) };
}

function getStockMetrics(products) {
  const lowStock = products.filter(product => Number(product.stock || 0) <= Number(product.lowStockThreshold ?? 5)).length;
  const outOfStock = products.filter(product => Number(product.stock || 0) === 0).length;
  const stockValue = products.reduce((total, product) => total + Number(product.stock || 0) * Number(product.priceHT || 0), 0);
  const stockCost = products.reduce((total, product) => total + Number(product.stock || 0) * Number(product.purchasePriceHT || 0), 0);

  return { lowStock, outOfStock, stockValue, stockCost };
}
