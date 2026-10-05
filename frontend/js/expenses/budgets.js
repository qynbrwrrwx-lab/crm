// expenses : budgets.

function currentMonthPaidByCategory(category) {
  const now = new Date();
  return allExpenses
    .filter(expense => {
      if (expense.status !== "paid" || (expense.category || "Autres") !== category) return false;
      const date = new Date(expense.paidAt || expense.updatedAt || expense.createdAt);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    })
    .reduce((total, expense) => total + Number(expense.amountTTC || 0), 0);
}

function renderExpenseBudgets() {
  const container = document.getElementById("expenseBudgetsList");
  if (!container) return;
  if (!allExpenseBudgets.length) {
    container.innerHTML = '<p class="empty-state">Ajoutez un budget mensuel pour suivre une catégorie.</p>';
    return;
  }
  container.innerHTML = allExpenseBudgets.map(budget => {
    const spent = currentMonthPaidByCategory(budget.category);
    const amount = Number(budget.monthlyAmount || 0);
    const percent = amount ? Math.round((spent / amount) * 100) : 0;
    const status = percent >= 100 ? "over" : percent >= 80 ? "warning" : "healthy";
    return `<article class="expense-budget-row ${status}"><div><strong>${escapeHtml(budget.category)}</strong><span><i style="width:${Math.min(percent, 100)}%"></i></span></div><div><b>${formatExpenseCurrency(spent)} <small>/ ${formatExpenseCurrency(amount)}</small></b><em>${percent} % utilisé</em></div><button type="button" class="expense-text-action danger" onclick="deleteExpenseBudget('${encodeURIComponent(budget.category)}')">Retirer</button></article>`;
  }).join("");
}

async function loadExpenseBudgets() {
  try {
    allExpenseBudgets = await apiFetch("/api/expense-budgets");
    renderExpenseBudgets();
  } catch (error) {
    console.error("Impossible de charger les budgets", error);
  }
}

async function saveExpenseBudget(event) {
  event.preventDefault();
  const category = document.getElementById("expenseBudgetCategory")?.value;
  const monthlyAmount = Number(document.getElementById("expenseBudgetAmount")?.value);
  if (!category || !Number.isFinite(monthlyAmount) || monthlyAmount < 0) return showToast("Saisissez un budget mensuel valide");
  try {
    await apiFetch(`/api/expense-budgets/${encodeURIComponent(category)}`, { method: "PUT", body: JSON.stringify({ monthlyAmount }) });
    document.getElementById("expenseBudgetAmount").value = "";
    showToast("Budget mensuel enregistré");
    await loadExpenseBudgets();
  } catch (error) { showToast(error.message || "Impossible d'enregistrer le budget"); }
}

async function deleteExpenseBudget(category) {
  const confirmed = await confirmAppAction({ title: "Retirer le budget", message: "Le suivi de cette catégorie sera retiré.", actionLabel: "Retirer", danger: true });
  if (!confirmed) return;
  try { await apiFetch(`/api/expense-budgets/${category}`, { method: "DELETE" }); showToast("Budget retiré"); await loadExpenseBudgets(); } catch (error) { showToast(error.message || "Impossible de retirer le budget"); }
}

function renderExpenseCategoryBreakdown(paidExpenses) {
  const container = document.getElementById("expenseCategoryBreakdown");
  if (!container) return;
  const totals = new Map();
  paidExpenses.forEach(expense => {
    const category = expense.category || "Autres";
    totals.set(category, (totals.get(category) || 0) + Number(expense.amountTTC || 0));
  });
  const categories = [...totals.entries()].sort(([, left], [, right]) => right - left);
  const grandTotal = categories.reduce((sum, [, total]) => sum + total, 0);
  if (!categories.length) {
    container.innerHTML = '<p class="empty-state">Les catégories apparaîtront lorsque vous aurez réglé vos premières dépenses.</p>';
    return;
  }
  container.innerHTML = categories.slice(0, 5).map(([category, total]) => {
    const percentage = grandTotal ? Math.round((total / grandTotal) * 100) : 0;
    return `<div class="expense-category-row"><div><strong>${escapeHtml(category)}</strong><span><i style="width:${percentage}%"></i></span></div><b>${formatExpenseCurrency(total)}</b><small>${percentage} % des charges réglées</small></div>`;
  }).join("");
}
