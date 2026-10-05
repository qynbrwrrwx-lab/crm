const express = require("express");

const publicQuoteController = require("../controllers/publicQuoteController");

const router = express.Router();

router.get("/:token", publicQuoteController.getPublicQuote);
router.post("/:token/accept", publicQuoteController.acceptPublicQuote);
router.post("/:token/decline", publicQuoteController.declinePublicQuote);

module.exports = router;
