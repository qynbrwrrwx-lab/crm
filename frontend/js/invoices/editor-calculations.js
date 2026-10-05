// Documents commerciaux : calcul des lignes et des totaux de l'éditeur.

function recalculateInvoiceLine(item, isEditing) {
  const product = item.productId || {}, discount = Number(item.discount || 0), fromCatalog = isEditing || !Number.isFinite(Number(item.unitHT));
  if (fromCatalog) { item.productName = product.name || item.productName || "Produit"; item.unitHT = Number(product.priceHT || 0); item.unitTTC = item.unitHT * (1 + Number(product.tva || 20) / 100); item.tva = Number(product.tva || 20); }
  item.lineHT = fromCatalog || !Number.isFinite(Number(item.lineHT)) ? item.unitHT * item.quantity * (1 - discount / 100) : Number(item.lineHT);
  item.lineTTC = fromCatalog || !Number.isFinite(Number(item.lineTTC)) ? item.unitTTC * item.quantity * (1 - discount / 100) : Number(item.lineTTC);
  return item;
}
function getInvoiceTotals(products) { return products.reduce((totals, item) => ({ totalHT: totals.totalHT + item.lineHT, totalTTC: totals.totalTTC + item.lineTTC }), { totalHT: 0, totalTTC: 0 }); }
