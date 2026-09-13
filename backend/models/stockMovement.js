const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ["restock", "sale"],
    required: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("StockMovement", stockMovementSchema);
