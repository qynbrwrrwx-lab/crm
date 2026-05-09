const express = require("express");

const Contact = require("../models/contact");

const auth =
  require("../middleware/auth");

const router = express.Router();

// ================= GET CONTACTS =================

router.get("/", auth, async (req, res) => {

  try {

    const contacts =
      await Contact.find({
        userId: req.userId
      }).sort({
        createdAt: -1
      });

    res.json(contacts);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur récupération contacts"
    });
  }
});

// ================= ADD CONTACT =================

router.post("/", auth, async (req, res) => {

  try {

    const contact =
      await Contact.create({

        ...req.body,

        userId: req.userId
      });

    res.json(contact);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur création contact"
    });
  }
});

// ================= UPDATE CONTACT =================

router.put("/:id", auth, async (req, res) => {

  try {

    const contact =
      await Contact.findOne({

        _id: req.params.id,

        userId: req.userId
      });

    if (!contact) {

      return res.status(404).json({
        error: "Contact introuvable"
      });
    }

    Object.assign(contact, req.body);

    await contact.save();

    res.json(contact);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur modification contact"
    });
  }
});

// ================= DELETE CONTACT =================

router.delete("/:id", auth, async (req, res) => {

  try {

    await Contact.findOneAndDelete({

      _id: req.params.id,

      userId: req.userId
    });

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

// ================= FAVORITE CONTACT =================

router.put("/favorite/:id", auth, async (req, res) => {

  try {

    const contact =
      await Contact.findOne({

        _id: req.params.id,

        userId: req.userId
      });

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
});

module.exports = router;