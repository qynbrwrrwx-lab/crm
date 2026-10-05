// expenses : form.

function showExpenseSupplierDetails() {
  const input = document.getElementById("expenseSupplier");
  const details = document.getElementById("expenseSupplierDetails");
  if (!input || !details || typeof allSuppliers === "undefined") return;
  const supplier = allSuppliers.find(item => item.name.toLocaleLowerCase("fr-FR") === input.value.trim().toLocaleLowerCase("fr-FR"));
  if (!supplier) {
    details.hidden = true;
    details.textContent = "";
    return;
  }
  const parts = [supplier.contactName, supplier.email, supplier.phone].filter(Boolean);
  details.textContent = parts.length ? `Fournisseur enregistré · ${parts.join(" · ")}` : "Fournisseur enregistré";
  details.hidden = false;
}

async function saveExpense(event) {
  event?.preventDefault();
  const { supplier, label, category, recurrence, amountTTC, dueDate } = readExpenseForm();
  if (!supplier || !label || !Number.isFinite(amountTTC) || amountTTC < 0 || (recurrence === "monthly" && !dueDate)) {
    showToast(recurrence === "monthly" && !dueDate ? "Une dépense mensuelle doit avoir une échéance" : "Renseignez le fournisseur, l'intitulé et un montant valide");
    return;
  }
  try {
    const endpoint = editingExpenseId ? `/api/expenses/${editingExpenseId}` : "/api/expenses";
    await apiFetch(endpoint, { method: editingExpenseId ? "PUT" : "POST", body: JSON.stringify({ supplier, label, category, recurrence, amountTTC, dueDate }) });
    const wasEditing = Boolean(editingExpenseId);
    cancelExpenseEdit();
    showToast(wasEditing ? "Dépense mise à jour" : "Dépense ajoutée");
    await loadExpenses();
  } catch (error) {
    showToast(error.message || "Impossible d'ajouter la dépense");
  }
}

async function editExpense(expenseId) {
  const expense = allExpenses.find(item => item._id === expenseId);
  if (!expense) return;
  editingExpenseId = expenseId;
  populateExpenseForm(expense);
  document.getElementById("expenseSubmitButton").textContent = "Enregistrer les modifications";
  document.getElementById("cancelExpenseEditButton").hidden = false;
  showExpenseSupplierDetails();
  document.getElementById("expenseForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
  document.getElementById("expenseSupplier")?.focus();
}

function cancelExpenseEdit() {
  editingExpenseId = null;
  resetExpenseForm();
  const submitButton = document.getElementById("expenseSubmitButton");
  if (submitButton) submitButton.textContent = "Ajouter la dépense";
  const cancelButton = document.getElementById("cancelExpenseEditButton");
  if (cancelButton) cancelButton.hidden = true;
  showExpenseSupplierDetails();
}
