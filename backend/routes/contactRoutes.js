const express = require("express");

const router = express.Router();

const Contact = require("../models/contact");
const Invoice = require("../models/invoice");

const auth = require("../middleware/auth");

// ================= GET CONTACTS =================

router.get("/", auth, async (req, res) => {

  try {

    const contacts =
      await Contact.find({ userId: req.userId })
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

router.put("/:id", auth, async (req, res) => {
  try {
    const allowedFields = ["type", "firstname", "lastname", "companyName", "siret", "email", "phone", "billingAddress", "shippingAddress", "notes", "lat", "lng"];
    const data = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId }, data, { new: true, runValidators: true }
    );
    if (!contact) return res.status(404).json({ error: "Contact introuvable" });
    res.json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur modification contact" });
  }
});

// ================= DELETE CONTACT =================

router.delete("/:id", auth, async (req, res) => {

  try {

    const usedInDocument = await Invoice.exists({
      userId: req.userId,
      contactId: req.params.id
    });

    if (usedInDocument) {
      return res.status(409).json({
        error: "Ce contact est lié à des documents et ne peut pas être supprimé"
      });
    }

    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!contact) {
      return res.status(404).json({
        error: "Contact introuvable"
      });
    }

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
  }
);

module.exports = router;
