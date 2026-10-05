const express = require("express");

const contactController = require("../controllers/contactController");
const auth = require("../middleware/auth");

const router = express.Router();

// Les URLs sont conservées afin de préserver le frontend et les intégrations existantes.
router.get("/", auth, contactController.listContacts);
router.post("/", auth, contactController.createContact);
router.put("/:id", auth, contactController.updateContact);
router.delete("/:id", auth, contactController.deleteContact);
router.put("/favorite/:id", auth, contactController.toggleFavorite);

module.exports = router;
