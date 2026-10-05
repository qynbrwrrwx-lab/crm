// Sélection et tri purs du catalogue produits.
function selectProducts(products, { query = "", stockFilter = "all", categoryFilter = "all", sort = "recent" }) {
  const normalizedQuery = String(query).trim().toLocaleLowerCase("fr-FR");
  const priority = product => {
    const stock = Number(product.stock || 0);
    const threshold = Number(product.lowStockThreshold ?? 5);
    return stock === 0 ? 0 : stock <= threshold ? 1 : 2;
  };

  return products.filter(product =>
    [product.name, product.reference, product.description, product.category]
      .filter(Boolean)
      .some(value => String(value).toLocaleLowerCase("fr-FR").includes(normalizedQuery)) &&
    (stockFilter === "all" ||
      (stockFilter === "low" && Number(product.stock) <= Number(product.lowStockThreshold ?? 5)) ||
      (stockFilter === "available" && Number(product.stock) > Number(product.lowStockThreshold ?? 5))) &&
    (categoryFilter === "all" || (product.category || "Non classé") === categoryFilter)
  ).sort((left, right) => {
    if (sort === "restock-priority") return priority(left) - priority(right) || Number(left.stock || 0) - Number(right.stock || 0);
    if (sort === "name") return String(left.name || "").localeCompare(String(right.name || ""), "fr-FR");
    if (sort === "stock-asc") return Number(left.stock || 0) - Number(right.stock || 0);
    if (sort === "stock-desc") return Number(right.stock || 0) - Number(left.stock || 0);
    if (sort === "price-asc") return Number(left.priceHT || 0) - Number(right.priceHT || 0);
    if (sort === "price-desc") return Number(right.priceHT || 0) - Number(left.priceHT || 0);
    return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
  });
}

function getProductCategories(products) {
  return [...new Set(products.map(product => (product.category || "Non classé").trim()).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "fr-FR"));
}
