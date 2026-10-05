const express = require("express");

const companyController = require("../controllers/companyController");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, companyController.getCompany);
router.put("/", auth, companyController.updateCompany);

module.exports = router;
