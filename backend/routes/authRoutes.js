const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/user");

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

        isVerified: true
      });

    res.json({
      success: true,
      user
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur serveur"
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
          id: user._id
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

module.exports = router;