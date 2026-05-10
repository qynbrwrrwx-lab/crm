const express = require("express");

const router = express.Router();

const Product = require("../models/product");

const auth = require("../middleware/auth");

// ================= GET PRODUCTS =================

router.get("/", auth, async (req, res) => {

  try {

    const products =
      await Product.find()
      .sort({ createdAt: -1 });

    res.json(products);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur récupération produits"
    });
  }
});

// ================= CREATE PRODUCT =================

router.post("/", auth, async (req, res) => {

  try {

    const data = req.body;

    data.priceTTC =
      Number(data.priceHT) *
      (1 + Number(data.tva || 20) / 100);

    const product =
      await Product.create(data);

    res.json(product);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur création produit"
    });
  }
});

// ================= DELETE PRODUCT =================

router.delete("/:id", auth, async (req, res) => {

  try {

    await Product.findByIdAndDelete(
      req.params.id
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur suppression produit"
    });
  }
});

module.exports = router;