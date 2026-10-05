const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  invoiceNumber: String,

  type: {
    type: String,
    enum: ["quote", "order", "invoice", "credit_note"],
    default: "invoice"
  },

  status: {
    type: String,
    default: "draft"
  },

    sourceDocumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    default: null
  },

  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact"
  },

  sourceQuoteId: {
    type: mongoose.Schema.Types.ObjectId,
   ref: "Invoice",
    default: null
  },

  sourceOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    default: null
  },

  convertedToInvoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    default: null
  },

  convertedToOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    default: null
  },

  products: [{
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },

  quantity: Number,

  productName: String,

  unitHT: Number,

  unitTTC: Number,

  tva: Number,

  lineHT: Number,

  lineTTC: Number,

  discount: {
    type: Number,
    default: 0
  }
}],

  totalHT: Number,

  totalTTC: Number,

  paymentMethod: String,

  paymentTerms: {
    type: String,
    trim: true,
    default: ""
  },

  // Facture d'acompte distincte. Elle reste une facture au sens comptable,
  // mais est rattachée au devis sans interférer avec sa conversion en commande.
  isDepositInvoice: { type: Boolean, default: false },
  depositForQuoteId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", default: null, index: true },
  depositRate: { type: Number, min: 0, max: 100, default: null },

  paymentDueDays: {
    type: Number,
    min: 0,
    max: 365,
    default: 30
  },

  paymentDueDate: {
    type: Date,
    default: null
  },

  quoteValidityDays: {
    type: Number,
    min: 1,
    default: null
  },

  paymentStatus: {
    type: String,
    default: "pending"
  },

  fulfillmentStatus: {
    type: String,
    enum: ["to_prepare", "prepared", "shipped", "delivered"],
    default: "to_prepare"
  },
  preparedAt: { type: Date, default: null },
  shippedAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },

  creditNoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    default: null
  },

  paidAt: {
    type: Date,
    default: null
  },

  payments: [{
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, required: true },
    paidAt: { type: Date, required: true }
  }],

  emailSentAt: {
    type: Date,
    default: null
  },

  emailRecipient: {
    type: String,
    trim: true,
    lowercase: true,
    default: ""
  },

  emailStatus: {
    type: String,
    enum: ["pending", "sent", "failed"],
    default: "pending"
  },

  emailFailedAt: {
    type: Date,
    default: null
  },

  paymentReminderSentAt: {
    type: Date,
    default: null
  },

  // Lien public de consultation/acceptation, réservé aux devis. Seul le hash
  // est conservé : le jeton envoyé au client ne peut pas être relu en base.
  clientAccessTokenHash: { type: String, default: "", index: true },
  clientAccessTokenExpiresAt: { type: Date, default: null },
  clientAcceptedAt: { type: Date, default: null },
  clientDeclinedAt: { type: Date, default: null },
  clientDeclineReason: { type: String, trim: true, maxlength: 500, default: "" },

  // Réservé aux échanges avec une plateforme agréée. Aucun envoi n'est
  // déclenché tant qu'un connecteur partenaire n'est pas configuré.
  electronicTransmission: {
    status: {
      type: String,
      enum: ["not_applicable", "ready", "queued", "sent", "delivered", "rejected", "error"],
      default: "not_applicable"
    },
    providerKey: { type: String, default: "" },
    externalId: { type: String, default: "" },
    lastAttemptAt: { type: Date, default: null },
    lastError: { type: String, default: "" }
  }

}, {
  timestamps: true
});

// Empêche qu'un même compte obtienne deux fois le même numéro de document.
invoiceSchema.index({ userId: 1, invoiceNumber: 1 }, { unique: true, sparse: true });

// A quote and an order can each be converted only once, even if two requests
// arrive at the same time. Partial indexes exclude the legacy null values.
invoiceSchema.index(
  { userId: 1, sourceQuoteId: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceQuoteId: { $type: "objectId" } }
  }
);
invoiceSchema.index(
  { userId: 1, sourceOrderId: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceOrderId: { $type: "objectId" } }
  }
);
invoiceSchema.index(
  { userId: 1, sourceDocumentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "credit_note",
      sourceDocumentId: { $type: "objectId" }
    }
  }
);

module.exports = mongoose.model(
  "Invoice",
  invoiceSchema
);
