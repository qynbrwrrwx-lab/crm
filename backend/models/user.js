const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  resetTokenHash: String,

  resetTokenExpiresAt: Date,
  
  verifyTokenHash: String,

  verifyTokenExpiresAt: Date,

  isVerified: {
    type: Boolean,
    default: false
  },
  isSuspended: { type: Boolean, default: false },
  subscriptionStatus: {
    type: String,
    enum: ["trial", "active", "suspended", "cancelled"],
    default: "trial"
  },
  trialEndsAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },

  role: {
    type: String,
    default: "user"
  }

}, {
  timestamps: true
});

module.exports = mongoose.model(
  "User",
  userSchema
);
