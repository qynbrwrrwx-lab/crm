const express = require("express");
const { applyAppMiddleware } = require("./middleware");
const { registerApiRoutes, registerFrontendRoutes } = require("./routes");

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("json escape", true);
  applyAppMiddleware(app);
  registerApiRoutes(app);
  registerFrontendRoutes(app);

  return app;
}

module.exports = { createApp };
