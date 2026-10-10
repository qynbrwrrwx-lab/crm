// expenses : sélection et indicateurs de liste.

function selectExpenses(expenses, filters = {}) {
  const query = (filters.query || "").trim().toLocaleLowerCase("fr-FR");
  const status = filters.status || "all";
  const category = filters.category || "all";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pendingExpenses = expenses.filter(expense => expense.status === "pending");
  const paidExpenses = expenses.filter(expense => expense.status === "paid");
  const visibleExpenses = expenses.filter(expense => {
    const matchesText = [expense.supplier, expense.label].join(" ").toLocaleLowerCase("fr-FR").includes(query);
    const dueDate = expense.dueDate ? new Date(expense.dueDate) : null;
    const isOverdue = expense.status !== "paid" && dueDate && dueDate < today;
    const matchesStatus = status === "all" || (status === "overdue" ? isOverdue : expense.status === status);
    return matchesText && matchesStatus && (category === "all" || (expense.category || "Autres") === category);
  });
  const totalFor = items => items.reduce((total, expense) => total + Number(expense.amountTTC || 0), 0);
  return {
    pendingExpenses,
    paidExpenses,
    visibleExpenses,
    pendingTotal: totalFor(pendingExpenses),
    paidTotal: totalFor(paidExpenses)
  };
}

function readExpenseListFilters() {
  return {
    query: document.getElementById("expensesFilter")?.value,
    status: document.getElementById("expensesStatusFilter")?.value,
    category: document.getElementById("expensesCategoryFilter")?.value
  };
}
