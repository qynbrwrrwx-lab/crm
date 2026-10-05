const mongoose = require("mongoose");

module.exports = mongoose.model("TreasurySettings", new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  openingBalance: { type: Number, default: 0 },
  openingBalanceDate: { type: Date, default: Date.now },
  minimumBalance: { type: Number, default: 0, min: 0 }
}, { timestamps: true }));
