const mongoose = require("mongoose");

const expenseBudgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  monthlyAmount: { type: Number, required: true, min: 0 }
}, { timestamps: true });

expenseBudgetSchema.index({ userId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("ExpenseBudget", expenseBudgetSchema);
