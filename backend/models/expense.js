const mongoose = require("mongoose");
module.exports = mongoose.model("Expense", new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  supplier: { type: String, required: true, trim: true, maxlength: 140 },
  label: { type: String, required: true, trim: true, maxlength: 200 },
  category: { type: String, trim: true, maxlength: 60, default: "Autres" },
  amountTTC: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, default: null },
  recurrence: { type: String, enum: ["none", "monthly"], default: "none" },
  status: { type: String, enum: ["pending", "paid"], default: "pending" },
  paidAt: { type: Date, default: null }
}, { timestamps: true }));
