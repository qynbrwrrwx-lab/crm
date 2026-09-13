const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  name: {
    type: String,
    required: true
  },

  reference: String,

  description: String,

  priceHT: {
    type: Number,
    default: 0,
    min: 0
  },

  tva: {
    type: Number,
    default: 20,
    min: 0,
    max: 100
  },

  priceTTC: {
    type: Number,
    default: 0
  },

  stock: {
    type: Number,
    default: 0,
    min: 0
  }

}, {
  timestamps: true
});

module.exports = mongoose.model(
  "Product",
  productSchema
);
