const express = require("express");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/user");
const Contact = require("../models/contact");
const Product = require("../models/product");
const Invoice = require("../models/invoice");
const Company = require("../models/companyModel");
const StockMovement = require("../models/stockMovement");
const AuditLog = require("../models/auditLog");
const auth = require("../middleware/auth");
const { recordAuditEvent } = require("../services/auditService");

const {
  sendResetEmail,
  sendVerificationEmail
} = require("../services/emailService");

const router = express.Router();

const TOKEN_LIFETIME_MS = 60 * 60 * 1000;

const sensitiveAccountLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: req => String(req.userId),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives. Réessayez dans quelques minutes." }
});

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function isValidPassword(password) {
  return typeof password === "string" && password.length >= 12;
}

router.get("/export-data", auth, async (req, res) => {
  try {
    const [user, company, contacts, products, invoices, stockMovements] = await Promise.all([
      User.findById(req.userId).select("email createdAt updatedAt"),
      Company.findOne({ userId: req.userId }),
      Contact.find({ userId: req.userId }),
      Product.find({ userId: req.userId }),
      Invoice.find({ userId: req.userId }),
      StockMovement.find({ userId: req.userId })
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      account: user,
      company,
      contacts,
      products,
      invoices,
      stockMovements
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible d'exporter les données" });
  }
});

router.get("/activity", auth, async (req, res) => {
  try {
    const events = await AuditLog.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("action metadata createdAt");
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer l'activité" });
  }
});

router.put("/change-password", auth, sensitiveAccountLimiter, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!user || typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({ error: "Informations de mot de passe invalides" });
    }

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ error: "Mot de passe actuel incorrect" });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 12 caractères" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await recordAuditEvent({ userId: user._id, action: "user.password_changed" });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de modifier le mot de passe" });
  }
});

router.delete("/delete-account", auth, sensitiveAccountLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "Compte introuvable" });
    }

    if (typeof password !== "string" || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Mot de passe incorrect" });
    }

    await Promise.all([
      Company.deleteMany({ userId: req.userId }),
      Contact.deleteMany({ userId: req.userId }),
      Product.deleteMany({ userId: req.userId }),
      Invoice.deleteMany({ userId: req.userId }),
      StockMovement.deleteMany({ userId: req.userId }),
      AuditLog.deleteMany({ userId: req.userId })
    ]);
    await user.deleteOne();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de supprimer le compte" });
  }
});

// REGISTER
router.post("/register", async (req, res) => {

  try {

    let { email, password } = req.body;

    if (typeof email !== "string" || !isValidPassword(password)) {
      return res.status(400).json({
        error: "Utilisez un email valide et un mot de passe d'au moins 12 caractères"
      });
    }

    email = email.toLowerCase().trim();

    const existing =
      await User.findOne({ email });

    if (existing) {

      return res.status(400).json({
        error: "Email déjà utilisé"
      });
    }

    const hash =
      await bcrypt.hash(password, 10);

    const verifyToken =
      crypto.randomBytes(32).toString("hex");

    const user =
      await User.create({

        email,

        password: hash,

        verifyTokenHash: hashToken(verifyToken),

        verifyTokenExpiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),

        isVerified: false
      });

    // ENVOI EMAIL VERIFICATION
    await sendVerificationEmail({

      to: email,

      verificationLink:
`${process.env.BASE_URL}/api/auth/verify-email/${verifyToken}`
    });

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur inscription"
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {

  try {

    let { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        error: "Email et mot de passe requis"
      });
    }

    email = email.toLowerCase().trim();

    const user =
      await User.findOne({ email });

    if (!user) {

      return res.status(400).json({
        error: "Compte introuvable"
      });
    }

    const valid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!valid) {

      return res.status(400).json({
        error: "Mot de passe incorrect"
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: "Veuillez vérifier votre adresse email avant de vous connecter"
      });
    }

    const token =
  jwt.sign(
    {
      userId: user._id
    },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d"
        }
      );

    await recordAuditEvent({
      userId: user._id,
      action: "user.login"
    });

    res.json({
      success: true,
      token
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur serveur"
    });
  }
});

// ================= RESET PASSWORD REQUEST =================

router.post(
  "/request-reset",
  async (req, res) => {

    try {

      const { email } = req.body;

      if (typeof email !== "string" || !email.trim()) {

        return res.status(400).json({
          error: "Email requis"
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      const user =
        await User.findOne({ email: normalizedEmail });

      if (!user) {

        return res.status(404).json({
          error: "Utilisateur introuvable"
        });
      }

      const resetToken =
        crypto.randomBytes(32).toString("hex");

      user.resetTokenHash = hashToken(resetToken);

      user.resetTokenExpiresAt = new Date(
        Date.now() + TOKEN_LIFETIME_MS
      );

      await user.save();

      await sendResetEmail({

        to: email,

        resetLink:
          `${process.env.BASE_URL}/reset-password/${resetToken}`
      });

      res.json({
        success: true,
        message: "Email reset envoyé"
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Erreur serveur"
      });
    }
  }
);

// ================= CHANGE PASSWORD =================

router.post(
  "/reset-password/:token",
  async (req, res) => {

    try {

      const { token } = req.params;

      const { password } = req.body;

      if (!isValidPassword(password)) {
        return res.status(400).json({
          error: "Le mot de passe doit contenir au moins 12 caractères"
        });
      }

      const user =
        await User.findOne({
          resetTokenHash: hashToken(token),
          resetTokenExpiresAt: { $gt: new Date() }
        });

      if (!user) {

        return res.status(400).json({
          error: "Token invalide"
        });
      }

      const hashedPassword =
        await bcrypt.hash(password, 10);

      user.password = hashedPassword;

      user.resetTokenHash = null;

      user.resetTokenExpiresAt = null;

      await user.save();

      res.json({
        success: true,
        message: "Mot de passe modifié"
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Erreur serveur"
      });
    }
  }
);

// ================= RESEND EMAIL =================

router.post(
  "/resend-verification",
  async (req, res) => {

    try {

      const { email } = req.body;

      if (typeof email !== "string" || !email.trim()) {

        return res.status(400).json({
          error: "Email requis"
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      const user = await User.findOne({
        email: normalizedEmail
      });

      if (!user || user.isVerified) {
        return res.json({ success: true });
      }

      const verifyToken =
        crypto.randomBytes(32).toString("hex");

      user.verifyTokenHash = hashToken(verifyToken);

      user.verifyTokenExpiresAt = new Date(
        Date.now() + TOKEN_LIFETIME_MS
      );

      await user.save();

      await sendVerificationEmail({

        to: email,

        verificationLink:
          `${process.env.BASE_URL}/api/auth/verify-email/${verifyToken}`
      });

      res.json({
        success: true,
        message:
          "Email validation renvoyé"
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Erreur serveur"
      });
    }
  }
);

// ================= VERIFY EMAIL =================

router.get(
  "/verify-email/:token",
  async (req, res) => {

    try {

      const token = req.params.token;

      const user =
        await User.findOne({
          verifyTokenHash: hashToken(token),
          verifyTokenExpiresAt: { $gt: new Date() }
        });

      // TOKEN INVALIDE OU DÉJÀ UTILISÉ
      if (!user) {

        return res.redirect(
          `${process.env.BASE_URL}/verify-email-already`
        );
      }

      // EMAIL DÉJÀ VALIDÉ
      if (user.isVerified) {

        return res.redirect(
          `${process.env.BASE_URL}/verify-email-already`
        );
      }

      // VALIDATION EMAIL
      user.isVerified = true;

      // SUPPRESSION TOKEN
      user.verifyTokenHash = null;

      user.verifyTokenExpiresAt = null;

      await user.save();

      return res.redirect(
        `${process.env.BASE_URL}/verify-email-success`
      );

    } catch (err) {

      console.error(err);

      return res.redirect(
        `${process.env.BASE_URL}/verify-email-error`
      );
    }
  }
);

module.exports = router;
