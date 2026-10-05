const Expense = require("../../models/expense");

function getExpenseData(body = {}) {
  return { supplier: String(body.supplier || "").trim(), label: String(body.label || "").trim(), category: String(body.category || "").trim() || "Autres", amountTTC: Number(body.amountTTC), dueDate: body.dueDate || null, recurrence: body.recurrence === "monthly" ? "monthly" : "none" };
}

function validateExpense(expense) {
  return Boolean(expense.supplier) && Boolean(expense.label) && Number.isFinite(expense.amountTTC) && expense.amountTTC >= 0 && (expense.recurrence !== "monthly" || Boolean(expense.dueDate));
}

async function listExpenses(req, res) {
  try { return res.json(await Expense.find({ userId: req.userId }).sort({ dueDate: 1, createdAt: -1 })); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de la récupération des dépenses" }); }
}

async function createExpense(req, res) {
  try { const expenseData = getExpenseData(req.body); if (!validateExpense(expenseData)) return res.status(400).json({ error: "Vérifiez le fournisseur, le libellé, le montant et l'échéance mensuelle" }); return res.status(201).json(await Expense.create({ userId: req.userId, ...expenseData })); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de la création de la dépense" }); }
}

async function updateExpense(req, res) {
  try { const expenseData = getExpenseData(req.body); if (!validateExpense(expenseData)) return res.status(400).json({ error: "Vérifiez le fournisseur, le libellé, le montant et l'échéance mensuelle" }); const expense = await Expense.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, expenseData, { new: true, runValidators: true }); if (!expense) return res.status(404).json({ error: "Dépense introuvable" }); return res.json(expense); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de la modification de la dépense" }); }
}

async function deleteExpense(req, res) {
  try { const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId }); if (!expense) return res.status(404).json({ error: "Dépense introuvable" }); return res.json({ success: true }); }
  catch (error) { console.error(error); return res.status(500).json({ error: "Erreur lors de la suppression de la dépense" }); }
}

module.exports = { createExpense, deleteExpense, listExpenses, updateExpense };
