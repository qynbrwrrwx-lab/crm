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

  category: {
    type: String,
    trim: true,
    default: "Non classé",
    maxlength: 80
  },

  supplierName: {
    type: String,
    trim: true,
    maxlength: 120
  },

  supplierReference: {
    type: String,
    trim: true,
    maxlength: 80
  },

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
  },

  lowStockThreshold: {
    type: Number,
    default: 5,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: "Le seuil de stock doit être un entier positif ou nul"
    }
  }

}, {
  timestamps: true
});

module.exports = mongoose.model(
  "Product",
  productSchema
);
