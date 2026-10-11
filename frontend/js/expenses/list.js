// expenses : list.

function getExpenseListRowPresentation(expense) {
  const isPaid = expense.status === "paid";
  return {
    id: expense._id,
    className: `expense-item ${isPaid ? "is-paid" : "is-pending"}`,
    contextLabel: `${expense.category || "Autres"} · ${expense.supplier}${expense.recurrence === "monthly" ? " · Mensuelle" : ""}`,
    label: expense.label,
    dateLabel: isPaid ? `Réglée le ${formatExpenseDate(expense.paidAt?.slice?.(0, 10))}` : `À régler le ${formatExpenseDate(expense.dueDate?.slice?.(0, 10))}`,
    amountLabel: formatExpenseCurrency(expense.amountTTC),
    statusLabel: isPaid ? "Réglée" : "À payer",
    statusClass: isPaid ? "paid" : "pending",
    canMarkPaid: !isPaid
  };
}

function renderExpenseListRow(expense) {
  const item = getExpenseListRowPresentation(expense);
  return `<article class="${item.className}">
    <div class="expense-item-main">
      <span class="expense-supplier">${escapeHtml(item.contextLabel)}</span>
      <h3>${escapeHtml(item.label)}</h3>
      <small>${item.dateLabel}</small>
    </div>
    <div class="expense-item-amount"><strong>${item.amountLabel}</strong><span class="expense-status ${item.statusClass}">${item.statusLabel}</span></div>
    <div class="expense-actions">
      ${item.canMarkPaid ? `<button type="button" class="secondary-btn expense-pay-btn" onclick="markExpensePaid('${item.id}')">Marquer réglée</button>` : ""}
      <button type="button" class="expense-text-action" onclick="editExpense('${item.id}')">Modifier</button>
      <button type="button" class="expense-text-action danger" onclick="deleteExpense('${item.id}')">Supprimer</button>
    </div>
  </article>`;
}

function getExpenseListPresentation(selection, expenses) {
  const hasExpenses = expenses.length > 0;
  return {
    pendingTotalLabel: formatExpenseCurrency(selection.pendingTotal),
    paidTotalLabel: formatExpenseCurrency(selection.paidTotal),
    countLabel: `${expenses.length} dépense${expenses.length > 1 ? "s" : ""}`,
    emptyMessage: hasExpenses
      ? "Aucune dépense ne correspond aux filtres choisis."
      : "Aucune dépense enregistrée. Ajoutez vos premiers achats, abonnements ou frais fournisseurs."
  };
}

function renderExpenses() {
  const list = document.getElementById("expensesList");
  const pendingTotal = document.getElementById("expensesPendingTotal");
  const paidTotal = document.getElementById("expensesPaidTotal");
  const count = document.getElementById("expensesCount");
  if (!list) return;

  const selection = selectExpenses(allExpenses, readExpenseListFilters());
  const presentation = getExpenseListPresentation(selection, allExpenses);
  if (pendingTotal) pendingTotal.textContent = presentation.pendingTotalLabel;
  if (paidTotal) paidTotal.textContent = presentation.paidTotalLabel;
  if (count) count.textContent = presentation.countLabel;
  updateExpenseDashboard?.();
  renderSuppliers?.();
  renderExpenseCategoryBreakdown(selection.paidExpenses);
  renderExpenseBudgets();

  if (!selection.visibleExpenses.length) {
    list.innerHTML = `<p class="empty-state">${presentation.emptyMessage}</p>`;
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
