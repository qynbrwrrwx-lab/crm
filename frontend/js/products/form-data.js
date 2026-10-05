// Lecture, remplissage et réinitialisation du formulaire produit.
const productFormFieldIds = [
  "productName", "productReference", "productCategory", "productSupplierName",
  "productSupplierReference", "productDescription", "productPriceHT",
  "productPurchasePriceHT", "productStock"
];

function readProductFormData() {
  return {
    name: document.getElementById("productName").value,
    reference: document.getElementById("productReference").value,
    description: document.getElementById("productDescription").value,
    priceHT: document.getElementById("productPriceHT").value,
    purchasePriceHT: document.getElementById("productPurchasePriceHT")?.value || 0,
    tva: document.getElementById("productTVA").value,
    stock: document.getElementById("productStock").value,
    category: document.getElementById("productCategory").value,
    lowStockThreshold: document.getElementById("productLowStockThreshold").value,
    supplierName: document.getElementById("productSupplierName").value,
    supplierReference: document.getElementById("productSupplierReference").value
  };
}

function clearProductForm() {
  productFormFieldIds.forEach(id => { document.getElementById(id).value = ""; });
  document.getElementById("productTVA").value = "20";
  document.getElementById("productLowStockThreshold").value = "5";
}

function populateProductForm(product) {
  document.getElementById("productName").value = product.name || "";
  document.getElementById("productReference").value = product.reference || "";
  document.getElementById("productCategory").value = product.category || "Non classé";
  document.getElementById("productSupplierName").value = product.supplierName || "";
  document.getElementById("productSupplierReference").value = product.supplierReference || "";
  document.getElementById("productDescription").value = product.description || "";
  document.getElementById("productPriceHT").value = product.priceHT ?? "";
  document.getElementById("productPurchasePriceHT").value = product.purchasePriceHT ?? "";
  document.getElementById("productTVA").value = product.tva ?? 20;
  document.getElementById("productStock").value = product.stock ?? 0;
  document.getElementById("productLowStockThreshold").value = product.lowStockThreshold ?? 5;
}
