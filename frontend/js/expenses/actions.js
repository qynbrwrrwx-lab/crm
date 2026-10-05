// expenses : actions.

async function markExpensePaid(expenseId) {
  const confirmed = await confirmAppAction({ title: "Confirmer le règlement", message: "Cette dépense sera marquée comme réglée.", actionLabel: "Marquer réglée" });
  if (!confirmed) return;
  try {
    const result = await apiFetch(`/api/expenses/${expenseId}/pay`, { method: "PUT" });
    showToast(result.nextExpense ? "Dépense réglée · prochaine échéance créée" : "Dépense marquée comme réglée");
    await loadExpenses();
  } catch (error) {
    showToast(error.message || "Impossible de mettre à jour la dépense");
  }
}

async function deleteExpense(expenseId) {
  const confirmed = await confirmAppAction({ title: "Supprimer la dépense", message: "Cette suppression est définitive.", actionLabel: "Supprimer", danger: true });
  if (!confirmed) return;
  try {
    await apiFetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
    showToast("Dépense supprimée");
    await loadExpenses();
  } catch (error) {
    showToast(error.message || "Impossible de supprimer la dépense");
  }
}
