const { loadEnvironment, validateRuntimeConfig } = require("./config/runtime");

loadEnvironment();

const { createApp } = require("./app/create-app");
const { connectDatabase } = require("./config/database");

const app = createApp();

async function startServer(port = process.env.PORT || 3000) {
  validateRuntimeConfig();
  await connectDatabase();

  console.log("✅ MongoDB connecté");
  return app.listen(port, () => {
    console.log(`🚀 Serveur lancé sur port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  });
}

module.exports = { app, connectDatabase, startServer, validateRuntimeConfig };
