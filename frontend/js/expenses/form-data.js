// Dépenses : lecture, remplissage et remise à zéro du formulaire.

function readExpenseForm() {
  const dueDate = document.getElementById("expenseDueDate")?.value;
  return {
    supplier: document.getElementById("expenseSupplier")?.value.trim(),
    label: document.getElementById("expenseLabel")?.value.trim(),
    category: document.getElementById("expenseCategory")?.value || "Autres",
    recurrence: document.getElementById("expenseRecurrence")?.value || "none",
    amountTTC: Number(document.getElementById("expenseAmount")?.value),
    dueDate: dueDate || undefined
  };
}

function populateExpenseForm(expense) {
  document.getElementById("expenseSupplier").value = expense.supplier || "";
  document.getElementById("expenseLabel").value = expense.label || "";
  document.getElementById("expenseCategory").value = expense.category || "Autres";
  document.getElementById("expenseRecurrence").value = expense.recurrence || "none";
  document.getElementById("expenseAmount").value = Number(expense.amountTTC || 0).toFixed(2);
  document.getElementById("expenseDueDate").value = expense.dueDate?.slice?.(0, 10) || "";
}

function resetExpenseForm() {
  document.getElementById("expenseForm")?.reset();
}
