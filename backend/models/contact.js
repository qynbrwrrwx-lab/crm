const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  type: {
    type: String,
    default: "client"
  },

  firstname: String,

  lastname: String,

  companyName: String,

  siret: String,

  email: String,

  phone: String,

  billingAddress: String,

  shippingAddress: String,

  notes: String,

  favorite: {
    type: Boolean,
    default: false
  },

  lat: Number,

  lng: Number

}, {
  timestamps: true
});

module.exports = mongoose.model(
  "Contact",
  contactSchema
);
