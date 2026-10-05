// expenses : shared.

function formatExpenseCurrency(value) {
  return formatCurrency(value);
}

function formatExpenseDate(value) {
  if (!value) return "Échéance non renseignée";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? "Échéance non renseignée" : formatDate(date);
}
