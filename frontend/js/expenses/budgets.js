// expenses : budgets.

function getExpenseBudgetActionPresentation() {
  return {
    invalidMessage: "Saisissez un budget mensuel valide",
    savedMessage: "Budget mensuel enregistré",
    deletion: {
      confirmation: {
        title: "Retirer le budget",
        message: "Le suivi de cette catégorie sera retiré.",
        actionLabel: "Retirer",
        danger: true
      },
      successMessage: "Budget retiré"
    }
  };
}

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

function getExpenseBudgetSummary(budget) {
  const spent = currentMonthPaidByCategory(budget.category);
  const amount = Number(budget.monthlyAmount || 0);
  const percent = amount ? Math.round((spent / amount) * 100) : 0;
  return {
    ...budget,
    spent,
    amount,
    percent,
    progress: Math.min(percent, 100),
    status: percent >= 100 ? "over" : percent >= 80 ? "warning" : "healthy"
  };
}

function getExpenseBudgetRowPresentation(budget) {
  const { category, spent, amount, percent, progress, status } = getExpenseBudgetSummary(budget);
  return {
    category,
    status,
    progress,
    spentLabel: formatExpenseCurrency(spent),
    amountLabel: formatExpenseCurrency(amount),
    usageLabel: `${percent} % utilisé`,
    encodedCategory: encodeURIComponent(category)
  };
}

function renderExpenseBudgetRow(budget) {
  const item = getExpenseBudgetRowPresentation(budget);
  return `<article class="expense-budget-row ${item.status}"><div><strong>${escapeHtml(item.category)}</strong><span><i style="width:${item.progress}%"></i></span></div><div><b>${item.spentLabel} <small>/ ${item.amountLabel}</small></b><em>${item.usageLabel}</em></div><button type="button" class="expense-text-action danger" onclick="deleteExpenseBudget('${item.encodedCategory}')">Retirer</button></article>`;
}

function renderExpenseBudgets() {
  const container = document.getElementById("expenseBudgetsList");
  if (!container) return;
  if (!allExpenseBudgets.length) {
    container.innerHTML = '<p class="empty-state">Ajoutez un budget mensuel pour suivre une catégorie.</p>';
    return;
  }
  container.innerHTML = allExpenseBudgets.map(renderExpenseBudgetRow).join("");
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
  const presentation = getExpenseBudgetActionPresentation();
  const category = document.getElementById("expenseBudgetCategory")?.value;
  const monthlyAmount = Number(document.getElementById("expenseBudgetAmount")?.value);
  if (!category || !Number.isFinite(monthlyAmount) || monthlyAmount < 0) return showToast(presentation.invalidMessage);
  try {
    await apiFetch(`/api/expense-budgets/${encodeURIComponent(category)}`, { method: "PUT", body: JSON.stringify({ monthlyAmount }) });
    document.getElementById("expenseBudgetAmount").value = "";
    showToast(presentation.savedMessage);
    await loadExpenseBudgets();
  } catch (error) { showToast(error.message || "Impossible d'enregistrer le budget"); }
}

async function deleteExpenseBudget(category) {
  const presentation = getExpenseBudgetActionPresentation().deletion;
  const confirmed = await confirmAppAction(presentation.confirmation);
  if (!confirmed) return;
  try { await apiFetch(`/api/expense-budgets/${category}`, { method: "DELETE" }); showToast(presentation.successMessage); await loadExpenseBudgets(); } catch (error) { showToast(error.message || "Impossible de retirer le budget"); }
}

function getExpenseCategoryBreakdownPresentation(paidExpenses) {
  const totals = new Map();
  paidExpenses.forEach(expense => {
    const category = expense.category || "Autres";
    totals.set(category, (totals.get(category) || 0) + Number(expense.amountTTC || 0));
  });
  const categories = [...totals.entries()].sort(([, left], [, right]) => right - left);
  const grandTotal = categories.reduce((sum, [, total]) => sum + total, 0);
  return categories.slice(0, 5).map(([category, total]) => ({
    category,
    amountLabel: formatExpenseCurrency(total),
    percentage: grandTotal ? Math.round((total / grandTotal) * 100) : 0
  }));
}

function renderExpenseCategoryBreakdown(paidExpenses) {
  const container = document.getElementById("expenseCategoryBreakdown");
  if (!container) return;
  const categories = getExpenseCategoryBreakdownPresentation(paidExpenses);
  if (!categories.length) {
    container.innerHTML = '<p class="empty-state">Les catégories apparaîtront lorsque vous aurez réglé vos premières dépenses.</p>';
    return;
  }
  container.innerHTML = categories.map(item => `<div class="expense-category-row"><div><strong>${escapeHtml(item.category)}</strong><span><i style="width:${item.percentage}%"></i></span></div><b>${item.amountLabel}</b><small>${item.percentage} % des charges réglées</small></div>`).join("");
}
