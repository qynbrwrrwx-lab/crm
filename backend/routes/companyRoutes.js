const express = require("express");

const router = express.Router();

const Company =
  require("../models/companyModel");

// GET COMPANY

router.get("/", async (req, res) => {

  try {

    let company =
      await Company.findOne();

    if (!company) {

      company =
        await Company.create({});
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

router.put("/", async (req, res) => {

  try {

    let company =
      await Company.findOne();

    if (!company) {

      company =
        await Company.create(req.body);

    } else {

      Object.assign(
        company,
        req.body
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