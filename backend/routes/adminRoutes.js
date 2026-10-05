const express = require("express");

const adminController = require("../controllers/adminController");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/stats", authMiddleware, adminMiddleware, adminController.getAdminStats);
router.get("/audit", authMiddleware, adminMiddleware, adminController.getAdminAudit);

router.post("/users/:id/resend-verification", authMiddleware, adminMiddleware, adminController.resendUserVerification);

router.get("/users/:id/summary", authMiddleware, adminMiddleware, adminController.getUserSummary);

router.put("/users/:id/suspension", authMiddleware, adminMiddleware, adminController.updateUserSuspension);
router.put("/users/:id/subscription", authMiddleware, adminMiddleware, adminController.updateUserSubscription);

// ================= FACTURES D'ABONNEMENT MY PROSPECT =================

router.get("/subscription-invoices", authMiddleware, adminMiddleware, adminController.listSubscriptionInvoices);

router.post("/users/:id/subscription-invoices", authMiddleware, adminMiddleware, adminController.createSubscriptionInvoice);

router.get("/subscription-invoices/:id/pdf", authMiddleware, adminMiddleware, adminController.renderSubscriptionInvoicePdf);

router.post("/subscription-invoices/:id/send", authMiddleware, adminMiddleware, adminController.sendSubscriptionInvoice);

router.put("/subscription-invoices/:id/status", authMiddleware, adminMiddleware, adminController.updateSubscriptionInvoiceStatus);

router.get("/users", authMiddleware, adminMiddleware, adminController.listUsers);

module.exports = router;
