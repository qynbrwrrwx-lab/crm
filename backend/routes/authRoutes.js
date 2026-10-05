const express = require("express");
const rateLimit = require("express-rate-limit");
const auth = require("../middleware/auth");
const accountController = require("../controllers/accountController");
const authenticationController = require("../controllers/authenticationController");
const passwordResetController = require("../controllers/passwordResetController");
const emailVerificationController = require("../controllers/emailVerificationController");

const router = express.Router();

const sensitiveAccountLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: req => String(req.userId),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives. Réessayez dans quelques minutes." }
});

router.get("/session", auth, authenticationController.validateSession);

router.get("/export-data", auth, accountController.exportAccountData);

router.get("/activity", auth, accountController.getAccountActivity);

router.put("/change-password", auth, sensitiveAccountLimiter, accountController.changePassword);

router.delete("/delete-account", auth, sensitiveAccountLimiter, accountController.deleteAccount);

router.post("/register", authenticationController.register);
router.post("/login", authenticationController.login);
router.post("/request-reset", passwordResetController.requestPasswordReset);
router.post("/reset-password/:token", passwordResetController.resetPassword);
router.post("/resend-verification", emailVerificationController.resendVerification);
router.get("/verify-email/:token", emailVerificationController.verifyEmail);

module.exports = router;
