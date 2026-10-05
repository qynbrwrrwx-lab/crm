// État partagé du catalogue et formatage des prix.
let editingProductId = null;
let allProducts = [];
let restockingProductId = null;

function formatProductCurrency(value) {
  return formatCurrency(value);
}
