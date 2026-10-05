const mongoose = require("mongoose");

const treasuryEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  label: { type: String, required: true, trim: true, maxlength: 200 },
  amount: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ["income", "expense"], required: true },
  date: { type: Date, required: true },
  importFingerprint: { type: String, default: null }
}, { timestamps: true });

treasuryEntrySchema.index({ userId: 1, importFingerprint: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("TreasuryEntry", treasuryEntrySchema);
