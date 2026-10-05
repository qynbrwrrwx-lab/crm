const Expense = require("../../models/expense");

function getNextMonthlyDate(value) {
  const next = new Date(value);
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

async function markExpenseAsPaid(req, res) {
  try {
    const expense = await Expense.findOneAndUpdate({ _id: req.params.id, userId: req.userId, status: "pending" }, { status: "paid", paidAt: new Date() }, { new: true });
    if (!expense) return res.status(404).json({ error: "Dépense introuvable ou déjà réglée" });
    let nextExpense = null;
    if (expense.recurrence === "monthly" && expense.dueDate) nextExpense = await Expense.create({ userId: req.userId, supplier: expense.supplier, label: expense.label, category: expense.category, amountTTC: expense.amountTTC, dueDate: getNextMonthlyDate(expense.dueDate), recurrence: "monthly" });
    return res.json({ expense, nextExpense });
  } catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors du règlement de la dépense" }); }
}

module.exports = { markExpenseAsPaid };
