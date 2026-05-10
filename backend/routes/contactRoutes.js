const express = require("express");

const router = express.Router();

const Contact = require("../models/contact");

const auth = require("../middleware/auth");

// ================= GET CONTACTS =================

router.get("/", auth, async (req, res) => {

  try {

    const contacts =
      await Contact.find()
      .sort({ createdAt: -1 });

    res.json(contacts);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur récupération contacts"
    });
  }
});

// ================= CREATE CONTACT =================

router.post("/", auth, async (req, res) => {

  try {

    const contact =
      await Contact.create(req.body);

    res.json(contact);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur création contact"
    });
  }
});

// ================= DELETE CONTACT =================

router.delete("/:id", auth, async (req, res) => {

  try {

    await Contact.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur suppression contact"
    });
  }
});

// ================= FAVORITE =================

router.put(
  "/favorite/:id",
  auth,
  async (req, res) => {

    try {

      const contact =
        await Contact.findById(
          req.params.id
        );

      if (!contact) {

        return res.status(404).json({
          error: "Contact introuvable"
        });
      }

      contact.favorite =
        !contact.favorite;

      await contact.save();

      res.json(contact);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Erreur favoris"
      });
    }
  }
);

module.exports = router;