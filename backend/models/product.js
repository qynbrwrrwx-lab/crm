const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  reference: String,

  description: String,

  priceHT: {
    type: Number,
    default: 0
  },

  tva: {
    type: Number,
    default: 20
  },

  priceTTC: {
    type: Number,
    default: 0
  },

  stock: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});

module.exports = mongoose.model(
  "Product",
  productSchema
);