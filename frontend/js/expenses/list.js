// expenses : list.

function renderExpenseListRow(expense) {
  const isPaid = expense.status === "paid";
  return `<article class="expense-item ${isPaid ? "is-paid" : "is-pending"}">
    <div class="expense-item-main">
      <span class="expense-supplier">${escapeHtml(expense.category || "Autres")} · ${escapeHtml(expense.supplier)}${expense.recurrence === "monthly" ? " · Mensuelle" : ""}</span>
      <h3>${escapeHtml(expense.label)}</h3>
      <small>${isPaid ? `Réglée le ${formatExpenseDate(expense.paidAt?.slice?.(0, 10))}` : `À régler le ${formatExpenseDate(expense.dueDate?.slice?.(0, 10))}`}</small>
    </div>
    <div class="expense-item-amount"><strong>${formatExpenseCurrency(expense.amountTTC)}</strong><span class="expense-status ${isPaid ? "paid" : "pending"}">${isPaid ? "Réglée" : "À payer"}</span></div>
    <div class="expense-actions">
      ${isPaid ? "" : `<button type="button" class="secondary-btn expense-pay-btn" onclick="markExpensePaid('${expense._id}')">Marquer réglée</button>`}
      <button type="button" class="expense-text-action" onclick="editExpense('${expense._id}')">Modifier</button>
      <button type="button" class="expense-text-action danger" onclick="deleteExpense('${expense._id}')">Supprimer</button>
    </div>
  </article>`;
}

function renderExpenses() {
  const list = document.getElementById("expensesList");
  const pendingTotal = document.getElementById("expensesPendingTotal");
  const paidTotal = document.getElementById("expensesPaidTotal");
  const count = document.getElementById("expensesCount");
  if (!list) return;

  const selection = selectExpenses(allExpenses, readExpenseListFilters());
  if (pendingTotal) pendingTotal.textContent = formatExpenseCurrency(selection.pendingTotal);
  if (paidTotal) paidTotal.textContent = formatExpenseCurrency(selection.paidTotal);
  if (count) count.textContent = `${allExpenses.length} dépense${allExpenses.length > 1 ? "s" : ""}`;
  updateExpenseDashboard?.();
  renderSuppliers?.();
  renderExpenseCategoryBreakdown(selection.paidExpenses);
  renderExpenseBudgets();

  if (!selection.visibleExpenses.length) {
    list.innerHTML = `<p class="empty-state">${allExpenses.length ? "Aucune dépense ne correspond aux filtres choisis." : "Aucune dépense enregistrée. Ajoutez vos premiers achats, abonnements ou frais fournisseurs."}</p>`;
    return;
  }
  list.innerHTML = selection.visibleExpenses.map(renderExpenseListRow).join("");
}

function setExpenseQuickFilter(filter) {
  const select = document.getElementById("expensesStatusFilter");
  if (select) select.value = filter;
  renderExpenses();
}

async function loadExpenses() {
  try {
    allExpenses = await apiFetch("/api/expenses");
    renderExpenses();
    renderTreasury?.();
    loadExpenseBudgets();
  } catch (error) {
    console.error("Impossible de charger les dépenses", error);
  }
}
