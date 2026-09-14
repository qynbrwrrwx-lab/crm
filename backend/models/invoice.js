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

  paymentStatus: {
    type: String,
    default: "pending"
  },

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

  emailStatus: {
    type: String,
    enum: ["pending", "sent", "failed"],
    default: "pending"
  },

  emailFailedAt: {
    type: Date,
    default: null
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
