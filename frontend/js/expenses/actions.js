// expenses : actions.

function getExpensePaymentPresentation(hasNextExpense = false) {
  return {
    confirmation: {
      title: "Confirmer le règlement",
      message: "Cette dépense sera marquée comme réglée.",
      actionLabel: "Marquer réglée"
    },
    successMessage: hasNextExpense ? "Dépense réglée · prochaine échéance créée" : "Dépense marquée comme réglée"
  };
}

function getExpenseDeletionPresentation() {
  return {
    confirmation: {
      title: "Supprimer la dépense",
      message: "Cette suppression est définitive.",
      actionLabel: "Supprimer",
      danger: true
    },
    successMessage: "Dépense supprimée"
  };
}

async function markExpensePaid(expenseId) {
  const presentation = getExpensePaymentPresentation();
  const confirmed = await confirmAppAction(presentation.confirmation);
  if (!confirmed) return;
  try {
    const result = await apiFetch(`/api/expenses/${expenseId}/pay`, { method: "PUT" });
    showToast(getExpensePaymentPresentation(Boolean(result.nextExpense)).successMessage);
    await loadExpenses();
  } catch (error) {
    showToast(error.message || "Impossible de mettre à jour la dépense");
  }
}

async function deleteExpense(expenseId) {
  const presentation = getExpenseDeletionPresentation();
  const confirmed = await confirmAppAction(presentation.confirmation);
  if (!confirmed) return;
  try {
    await apiFetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
    showToast(presentation.successMessage);
    await loadExpenses();
  } catch (error) {
    showToast(error.message || "Impossible de supprimer la dépense");
  }
}
