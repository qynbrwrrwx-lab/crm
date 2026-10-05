// Fournisseurs : lignes de réassort d'un bon de commande.

function getPurchaseOrderLines(supplier, products) {
  const supplierName = String(supplier?.name || "").toLocaleLowerCase("fr-FR");
  return products
    .filter(product => String(product.supplierName || "").toLocaleLowerCase("fr-FR") === supplierName && Number(product.stock || 0) <= Number(product.lowStockThreshold ?? 5))
    .map(product => ({
      productId: product._id,
      name: product.name,
      reference: product.reference || "",
      quantity: Math.max(1, Number(product.lowStockThreshold ?? 5) * 2 - Number(product.stock || 0))
    }));
}
