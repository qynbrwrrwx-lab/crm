const mongoose = require("mongoose");

module.exports = mongoose.model("Supplier", new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 140 },
  contactName: { type: String, trim: true, maxlength: 120, default: "" },
  email: { type: String, trim: true, lowercase: true, maxlength: 180, default: "" },
  phone: { type: String, trim: true, maxlength: 40, default: "" },
  lastRestockRequestAt: { type: Date, default: null },
  notes: { type: String, trim: true, maxlength: 1000, default: "" }
}, { timestamps: true }));
