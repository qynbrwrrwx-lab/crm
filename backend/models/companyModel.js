const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({

  companyName: String,

  siret: String,

  vatNumber: String,

  phone: String,

  email: String,

  website: String,

  address: String,

  logo: String,

  activityType: String,

  trackQuantity: {
    type: Boolean,
    default: false
  },

  quantityUnit: {
    type: String,
    default: "Pièce"
  }

});

module.exports =
  mongoose.model(
    "Company",
    companySchema
  );