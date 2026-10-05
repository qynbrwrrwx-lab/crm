const express = require("express");

const auth = require("../middleware/auth");
const expenseController = require("../controllers/expenseController");

const router = express.Router();

router.get("/", auth, expenseController.listExpenses);
router.post("/", auth, expenseController.createExpense);
router.put("/:id", auth, expenseController.updateExpense);
router.put("/:id/pay", auth, expenseController.markExpenseAsPaid);
router.delete("/:id", auth, expenseController.deleteExpense);

module.exports = router;
