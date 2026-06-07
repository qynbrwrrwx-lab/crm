const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({

  invoiceNumber: String,

  type: {
    type: String,
    default: "invoice"
  },

  status: {
    type: String,
    default: "draft"
  },

  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact"
  },

  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    },

    quantity: Number
  }],

  totalHT: Number,

  totalTTC: Number,

  paymentMethod: String,

  paymentStatus: {
    type: String,
    default: "pending"
  }

}, {
  timestamps: true
});

module.exports = mongoose.model(
  "Invoice",
  invoiceSchema
);