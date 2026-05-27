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

  resetToken: String,
  
  verifyToken: {
    type: String
  },

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