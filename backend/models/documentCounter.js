const mongoose = require("mongoose");

const documentCounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 }
});

module.exports = mongoose.model("DocumentCounter", documentCounterSchema);
