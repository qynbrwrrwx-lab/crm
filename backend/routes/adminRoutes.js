const express = require("express");

const User = require("../models/user");

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");

const router = express.Router();

// GET ALL USERS
router.get(
  "/users",

  authMiddleware,

  adminMiddleware,

  async (req, res) => {

    try {

      const users =
        await User.find()
        .select("-password");

      res.json(users);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Erreur serveur"
      });
    }
  }
);

module.exports = router;