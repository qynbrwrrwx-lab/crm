const crypto = require("crypto");

const MINIMUM_PASSWORD_LENGTH = 12;
const TOKEN_LIFETIME_MS = 60 * 60 * 1000;

function createExpiringToken() {
  const token = crypto.randomBytes(32).toString("hex");
  return {
    token,
    hash: hashToken(token),
    expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS)
  };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function isValidPassword(password) {
  return typeof password === "string" && password.length >= MINIMUM_PASSWORD_LENGTH;
}

function getPublicBaseUrl(req) {
  const host = req.get("host");
  const isLocalRequest = /^localhost(?::\d+)?$|^127\.0\.0\.1(?::\d+)?$/i.test(host || "");
  if (isLocalRequest) return `${req.protocol}://${host}`;
  return String(process.env.BASE_URL || `${req.protocol}://${host}`).replace(/\/+$/, "");
}

module.exports = { createExpiringToken, getPublicBaseUrl, hashToken, isValidPassword, MINIMUM_PASSWORD_LENGTH };
