const express = require("express");

const auth = require("../middleware/auth");
const expenseBudgetController = require("../controllers/expenseBudgetController");

const router = express.Router();

router.get("/", auth, expenseBudgetController.listExpenseBudgets);
router.put("/:category", auth, expenseBudgetController.saveExpenseBudget);
router.delete("/:category", auth, expenseBudgetController.deleteExpenseBudget);

module.exports = router;
