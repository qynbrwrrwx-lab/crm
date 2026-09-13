const express = require("express");

const router = express.Router();

const Company =
  require("../models/companyModel");

const auth = require("../middleware/auth");

// GET COMPANY

router.get("/", auth, async (req, res) => {

  try {

    let company =
      await Company.findOne({ userId: req.userId });

    if (!company) {

      company =
        await Company.create({
          userId: req.userId
        });
    }

    res.json(company);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur serveur"
    });
  }

});

// UPDATE COMPANY

router.put("/", auth, async (req, res) => {

  try {

    let company =
      await Company.findOne({ userId: req.userId });

    if (!company) {

      company =
        await Company.create({
          ...req.body,
          userId: req.userId
        });

    } else {

      const { userId, ...companyData } = req.body;

      Object.assign(
        company,
        companyData
      );

      await company.save();
    }

    res.json(company);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur serveur"
    });
  }

});

module.exports = router;
