// expenses : csv.

function escapeExpenseCsv(value) {
  return escapeCsvValue(value);
}

function exportExpensesCsv() {
  if (!allExpenses.length) {
    showToast("Aucune dépense à exporter");
    return;
  }
  const headers = ["Fournisseur", "Intitulé", "Catégorie", "Montant TTC", "Échéance", "Statut", "Date de règlement"];
  const rows = allExpenses.map(expense => [
    expense.supplier,
    expense.label,
    expense.category || "Autres",
    Number(expense.amountTTC || 0).toFixed(2).replace(".", ","),
    expense.dueDate?.slice?.(0, 10) || "",
    expense.status === "paid" ? "Réglée" : "À payer",
    expense.paidAt?.slice?.(0, 10) || ""
  ]);
  const csv = [headers, ...rows].map(row => row.map(escapeExpenseCsv).join(";")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `my-prospect-depenses-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Export CSV téléchargé");
}
