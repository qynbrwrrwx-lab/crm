function loadEnvironment() {
  if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }
}

function validateRuntimeConfig() {
  const missing = ["MONGO_URI", "JWT_SECRET"].filter(name => !process.env[name]);

  if (missing.length) {
    throw new Error(`Configuration manquante : ${missing.join(", ")}`);
  }
}

module.exports = { loadEnvironment, validateRuntimeConfig };
