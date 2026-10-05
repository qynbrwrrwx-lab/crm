/** Formateurs partagés. Toutes les valeurs monétaires suivent la même convention française. */
function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatNumber(value, options = {}) {
  return new Intl.NumberFormat("fr-FR", options).format(Number(value || 0));
}

function formatDate(value, options = {}) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("fr-FR", options);
}

function formatDateTime(value, options = {}) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("fr-FR", options);
}
