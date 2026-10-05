const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    sparse: true,
    index: true
  },

  companyName: String,

  siret: String,

  vatNumber: String,

  phone: String,

  email: String,

  replyToEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ""
  },

  documentEmailIntro: { type: String, trim: true, maxlength: 800, default: "" },

  documentEmailClosing: { type: String, trim: true, maxlength: 500, default: "" },

  website: String,

  address: String,

  postalCode: String,

  city: String,

  companyBank: String,

  companyIban: String,

  companyBic: String,

  companyAccountHolder: String,

  rcs: String,

  ape: String,

  capitalSocial: String,

  legalMentions: String,

  deliveryTerms: {
    type: String,
    default: "30 jours"
  },

  paymentDueDays: {
    type: Number,
    min: 0,
    max: 365,
    default: 30
  },

  quoteValidity: {
    type: Number,
    default: 30
  },

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

  // Configuration indépendante par entreprise. Les identifiants et jetons
  // d'une plateforme agréée ne sont volontairement jamais enregistrés ici :
  // ils seront gérés par un connecteur chiffré propre à chaque partenaire.
  electronicInvoicing: {
    enabled: { type: Boolean, default: false },
    providerKey: { type: String, default: "" },
    providerName: { type: String, trim: true, maxlength: 100, default: "" },
    connectionStatus: {
      type: String,
      enum: ["not_configured", "pending", "connected", "error"],
      default: "not_configured"
    },
    preferredFormat: {
      type: String,
      enum: ["factur-x", "ubl", "cii"],
      default: "factur-x"
    },
    lastSyncedAt: { type: Date, default: null }
  },


});

module.exports =
  mongoose.model(
    "Company",
    companySchema
  );
