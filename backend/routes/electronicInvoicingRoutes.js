const express = require("express");

const auth = require("../middleware/auth");
const electronicInvoicingController = require("../controllers/electronicInvoicingController");

const router = express.Router();

router.get("/status", auth, electronicInvoicingController.getElectronicInvoicingStatus);

module.exports = router;
