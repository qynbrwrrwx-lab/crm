const mongoose = require("mongoose");

// Factures émises par My Prospect à ses propres abonnés. Elles sont séparées
// des factures métier créées par les utilisateurs dans leur espace client.
const subscriptionInvoiceSchema = new mongoose.Schema({
  subscriberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  invoiceNumber: { type: String, required: true, unique: true },
  planName: { type: String, required: true, trim: true, maxlength: 120 },
  amountHT: { type: Number, required: true, min: 0 },
  vatRate: { type: Number, required: true, min: 0, max: 100, default: 20 },
  totalTTC: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, default: null },
  status: {
    type: String,
    enum: ["draft", "sent", "paid", "cancelled"],
    default: "draft"
  },
  recipient: {
    email: { type: String, trim: true, lowercase: true, required: true },
    companyName: { type: String, trim: true, default: "" },
    siret: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    postalCode: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" }
  },
  sentAt: { type: Date, default: null },
  paidAt: { type: Date, default: null }
}, { timestamps: true });

subscriptionInvoiceSchema.index({ subscriberId: 1, createdAt: -1 });

module.exports = mongoose.model("SubscriptionInvoice", subscriptionInvoiceSchema);
