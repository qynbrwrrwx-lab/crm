const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({

  companyName: String,

  siret: String,

  vatNumber: String,

  phone: String,

  email: String,

  website: String,

  address: String,

  companyBank: String,

  rcs: String,

  ape: String,

  customUnit: String,

  logo: String,

  activityType: {
    type: String,
    default: "Autre"
  },

  trackQuantity: {
    type: Boolean,
    default: false
  },

  quantityUnit: {
    type: String,
    default: "Pièce"
  },

  customUnit: {
    type: String,
    default: ""
  },

  currency: {
    type: String,
    default: "€"
  },


});

module.exports =
  mongoose.model(
    "Company",
    companySchema
  );