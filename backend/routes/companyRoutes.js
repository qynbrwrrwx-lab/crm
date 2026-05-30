const express = require("express");

const router = express.Router();

router.get("/", async (req, res) => {

  res.json({
    message: "Company GET OK"
  });

});

router.put("/", async (req, res) => {

  res.json({
    message: "Company PUT OK"
  });

});

module.exports = router;