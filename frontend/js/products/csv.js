// Produits : csv. Voir README.md.

function exportProductsCsv() {
  const lines = [
    ["Nom", "Référence", "Catégorie", "Fournisseur", "Référence fournisseur", "Description", "Prix HT", "TVA", "Prix TTC", "Stock", "Seuil stock faible"],
    ...allProducts.map(product => [
      product.name || "",
      product.reference || "",
      product.category || "Non classé",
      product.supplierName || "",
      product.supplierReference || "",
      product.description || "",
      Number(product.priceHT || 0).toFixed(2),
      Number(product.tva || 0),
      Number(product.priceTTC || 0).toFixed(2),
      Number(product.stock || 0),
      Number(product.lowStockThreshold ?? 5)
    ])
  ];
  downloadCsvFile(lines, "produits");
}

function getProductCsvImportPresentation(validRowCount) {
  return {
    confirmation: {
      title: "Importer des produits ?",
      message: `${validRowCount} produit(s) valide(s) vont être ajouté(s) à votre catalogue.`,
      actionLabel: "Importer les produits"
    }
  };
}

async function handleProductsCsvImport(event) {
  try {
    const rows = await readCsvImport(event);
    if (!rows) return;
    const validRows = rows.filter(row => row.nom && row["prix ht"] !== "");
    if (!validRows.length) throw new Error("Aucune ligne valide : nom et prix HT sont obligatoires");
    const presentation = getProductCsvImportPresentation(validRows.length);
    if (!await confirmAppAction(presentation.confirmation)) return;

    showLoader();
    const failures = [];
    for (const [index, row] of validRows.entries()) {
      try {
        await apiFetch("/api/products", {
          method: "POST",
          body: JSON.stringify({
            name: row.nom,
            reference: row["référence"] || row.reference || "",
            category: row["catégorie"] || row.categorie || "Non classé",
            supplierName: row.fournisseur || "",
            supplierReference: row["référence fournisseur"] || row["reference fournisseur"] || "",
            description: row.description || "",
            priceHT: String(row["prix ht"] || "").replace(",", "."),
            tva: String(row.tva || "20").replace(",", "."),
            stock: row.stock || 0,
            lowStockThreshold: row["seuil stock faible"] || 5
          })
        });
      } catch (err) { failures.push(index + 1); }
    }
    await loadProducts();
    await loadInvoiceData();
    showToast(failures.length ? `${validRows.length - failures.length} produits importés, ${failures.length} ligne(s) ignorée(s)` : `${validRows.length} produits importés ✅`);
  } catch (err) {
    showToast(err.message || "Import produits impossible");
  } finally {
    hideLoader();
  }
}
