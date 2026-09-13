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
