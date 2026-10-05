const ExpenseBudget = require("../../models/expenseBudget");

function getCategory(value) {
  return decodeURIComponent(value || "").trim();
}

async function listExpenseBudgets(req, res) {
  try {
    return res.json(await ExpenseBudget.find({ userId: req.userId }).sort({ category: 1 }));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération des budgets" });
  }
}

async function saveExpenseBudget(req, res) {
  try {
    const category = getCategory(req.params.category);
    const monthlyAmount = Number(req.body.monthlyAmount);
    if (!category || !Number.isFinite(monthlyAmount) || monthlyAmount < 0) {
      return res.status(400).json({ error: "Catégorie et budget mensuel valides requis" });
    }
    const budget = await ExpenseBudget.findOneAndUpdate(
      { userId: req.userId, category },
      { monthlyAmount },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return res.json(budget);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement du budget" });
  }
}

async function deleteExpenseBudget(req, res) {
  try {
    const category = getCategory(req.params.category);
    const budget = await ExpenseBudget.findOneAndDelete({ userId: req.userId, category });
    if (!budget) return res.status(404).json({ error: "Budget introuvable" });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la suppression du budget" });
  }
}

module.exports = { deleteExpenseBudget, listExpenseBudgets, saveExpenseBudget };
