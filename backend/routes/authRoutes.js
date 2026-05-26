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

// REGISTER
router.post("/register", async (req, res) => {

  try {

    let { email, password } = req.body;

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

        verifyToken,

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

      if (!email) {

        return res.status(400).json({
          error: "Email requis"
        });
      }

      const user =
        await User.findOne({ email });

      if (!user) {

        return res.status(404).json({
          error: "Utilisateur introuvable"
        });
      }

      const resetToken =
        crypto.randomBytes(32).toString("hex");

      user.resetToken = resetToken;

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

      const user =
        await User.findOne({
          resetToken: token
        });

      if (!user) {

        return res.status(400).json({
          error: "Token invalide"
        });
      }

      const hashedPassword =
        await bcrypt.hash(password, 10);

      user.password = hashedPassword;

      user.resetToken = null;

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

      if (!email) {

        return res.status(400).json({
          error: "Email requis"
        });
      }

      const verifyToken =
        crypto.randomBytes(32).toString("hex");

      await sendVerificationEmail({

        to: email,

        verificationLink:
          `${process.env.BASE_URL}/verify-email/${verifyToken}`
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

      const user =
        await User.findOne({
          verifyToken: req.params.token
        });

      // TOKEN INVALIDE
      if (!user) {

        return res.redirect(
          `${process.env.BASE_URL}/verify-email-error`
        );
      }

      // EMAIL DÉJÀ VALIDÉ
      if (user.isVerified) {

        return res.redirect(
          `${process.env.BASE_URL}/verify-email-already`
        );
      }

      // VALIDATION
      user.isVerified = true;

      user.verifyToken = null;

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