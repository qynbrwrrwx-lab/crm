const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const adminRoutes = require("../routes/adminRoutes");
const authRoutes = require("../routes/authRoutes");
const companyRoutes = require("../routes/companyRoutes");
const contactRoutes = require("../routes/contactRoutes");
const electronicInvoicingRoutes = require("../routes/electronicInvoicingRoutes");
const expenseBudgetRoutes = require("../routes/expenseBudgetRoutes");
const expenseRoutes = require("../routes/expenseRoutes");
const invoiceRoutes = require("../routes/invoiceRoutes");
const opportunityRoutes = require("../routes/opportunityRoutes");
const productRoutes = require("../routes/productRoutes");
const publicQuoteRoutes = require("../routes/publicQuoteRoutes");
const purchaseOrderRoutes = require("../routes/purchaseOrderRoutes");
const supplierRoutes = require("../routes/supplierRoutes");
const taskRoutes = require("../routes/taskRoutes");
const treasuryRoutes = require("../routes/treasuryRoutes");

function registerApiRoutes(app) {
  app.get("/api/health", (req, res) => {
    const databaseConnected = mongoose.connection.readyState === 1;

    res.status(databaseConnected ? 200 : 503).json({
      status: databaseConnected ? "ok" : "degraded",
      database: databaseConnected ? "connected" : "disconnected"
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/contacts", contactRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/invoices", invoiceRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/company", companyRoutes);
  app.use("/api/electronic-invoicing", electronicInvoicingRoutes);
  app.use("/api/public/quotes", publicQuoteRoutes);
  app.use("/api/expenses", expenseRoutes);
  app.use("/api/suppliers", supplierRoutes);
  app.use("/api/expense-budgets", expenseBudgetRoutes);
  app.use("/api/treasury", treasuryRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/opportunities", opportunityRoutes);
  app.use("/api/purchase-orders", purchaseOrderRoutes);
}

function sendFrontendPage(res, file) {
  res.sendFile(path.join(__dirname, "../../frontend", file));
}

function registerFrontendRoutes(app) {
  app.use(express.static(path.join(__dirname, "../../frontend")));
  app.get("/admin-login", (req, res) => sendFrontendPage(res, "admin-login.html"));
  app.get("/admin", (req, res) => sendFrontendPage(res, "admin-dashboard.html"));
  app.get("/reset-password/:token", (req, res) => sendFrontendPage(res, "reset-password.html"));
  app.get("/quote/:token", (req, res) => sendFrontendPage(res, "quote-client.html"));
  app.get("*", (req, res) => sendFrontendPage(res, "index.html"));
}

module.exports = { registerApiRoutes, registerFrontendRoutes };
