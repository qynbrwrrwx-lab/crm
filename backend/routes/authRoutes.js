const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/user");

const {
  sendResetEmail,
  sendVerificationEmail
} = require("../services/emailService");

const router = express.Router();

const TOKEN_LIFETIME_MS = 60 * 60 * 1000;

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function isValidPassword(password) {
  return typeof password === "string" && password.length >= 12;
}

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
