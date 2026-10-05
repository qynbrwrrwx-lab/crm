// expenses : list.

function renderExpenses() {
  const list = document.getElementById("expensesList");
  const pendingTotal = document.getElementById("expensesPendingTotal");
  const paidTotal = document.getElementById("expensesPaidTotal");
  const count = document.getElementById("expensesCount");
  if (!list) return;

  const pending = allExpenses.filter(expense => expense.status === "pending");
  const paid = allExpenses.filter(expense => expense.status === "paid");
  if (pendingTotal) pendingTotal.textContent = formatExpenseCurrency(pending.reduce((total, expense) => total + Number(expense.amountTTC || 0), 0));
  if (paidTotal) paidTotal.textContent = formatExpenseCurrency(paid.reduce((total, expense) => total + Number(expense.amountTTC || 0), 0));
  if (count) count.textContent = `${allExpenses.length} dépense${allExpenses.length > 1 ? "s" : ""}`;
  updateExpenseDashboard?.();
  renderSuppliers?.();
  renderExpenseCategoryBreakdown(paid);
  renderExpenseBudgets();

  const query = document.getElementById("expensesFilter")?.value.trim().toLocaleLowerCase("fr-FR") || "";
  const statusFilter = document.getElementById("expensesStatusFilter")?.value || "all";
  const categoryFilter = document.getElementById("expensesCategoryFilter")?.value || "all";
  const visibleExpenses = allExpenses.filter(expense => {
    const matchesText = [expense.supplier, expense.label].join(" ").toLocaleLowerCase("fr-FR").includes(query);
    const dueDate = expense.dueDate ? new Date(expense.dueDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = expense.status !== "paid" && dueDate && dueDate < today;
    const matchesStatus = statusFilter === "all" || (statusFilter === "overdue" ? isOverdue : expense.status === statusFilter);
    return matchesText && matchesStatus && (categoryFilter === "all" || (expense.category || "Autres") === categoryFilter);
  });

  if (!visibleExpenses.length) {
    list.innerHTML = `<p class="empty-state">${allExpenses.length ? "Aucune dépense ne correspond aux filtres choisis." : "Aucune dépense enregistrée. Ajoutez vos premiers achats, abonnements ou frais fournisseurs."}</p>`;
    return;
  }

  list.innerHTML = visibleExpenses.map(expense => {
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
  }).join("");
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
