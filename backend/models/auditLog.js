const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
