// Documents commerciaux : calculs du brouillon de devis.

function getQuoteDraftSummary(lines, productsById) {
  const selectedLines = lines.filter(line => line.querySelector(".quote-product")?.value);
  const entries = selectedLines.map(line => {
    const product = productsById.get(line.querySelector(".quote-product").value);
    const quantity = Math.max(0, Number(line.querySelector(".quote-quantity")?.value || 0));
    const priceTTC = Number(product?.priceTTC || Number(product?.priceHT || 0) * (1 + Number(product?.tva || 0) / 100));
    return { product, quantity, priceTTC };
  });
  return {
    selectedLines,
    count: entries.reduce((sum, entry) => sum + entry.quantity, 0),
    total: entries.reduce((sum, entry) => sum + entry.priceTTC * entry.quantity, 0),
    shortages: entries.filter(entry => entry.product && entry.quantity > Number(entry.product.stock || 0))
  };
}
