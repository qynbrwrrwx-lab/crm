const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");

const allowedOrigins = [
  "https://www.my-prospect.com",
  "https://my-prospect.com",
  "https://crm-2-15ox.onrender.com"
];

function applyAuthRateLimits(app) {
  const loginLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5 });
  const registrationLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 10 });
  const accountActionLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5 });

  app.use("/api/auth/login", loginLimiter);
  app.use("/api/auth/register", registrationLimiter);
  app.use("/api/auth/request-reset", accountActionLimiter);
  app.use("/api/auth/resend-verification", accountActionLimiter);
}

function applyAppMiddleware(app) {
  app.use(express.static(path.join(__dirname, "../../frontend/public")));
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));
  app.use(helmet({ contentSecurityPolicy: false }));
  applyAuthRateLimits(app);
}

module.exports = { applyAppMiddleware };
