const express = require("express");

const Product =
  require("../models/product");

const auth =
  require("../middleware/auth");

const router = express.Router();

// ================= GET PRODUCTS =================

router.get("/", auth, async (req, res) => {

  try {

    const products =
      await Product.find({
        userId: req.userId
      }).sort({
        createdAt: -1
      });

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

    const {
      name,
      reference,
      description,
      category,
      barcode,
      supplier,
      priceHT,
      tva,
      stock
    } = req.body;

    const priceTTC =
      Number(priceHT) *
      (1 + Number(tva) / 100);

    const product =
      await Product.create({

        userId: req.userId,

        name,

        reference,

        description,

        category,

        barcode,

        supplier,

        priceHT,

        tva,

        priceTTC:
          Number(priceTTC.toFixed(2)),

        stock
      });

    res.json(product);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur création produit"
    });
  }
});

// ================= UPDATE PRODUCT =================

router.put("/:id", auth, async (req, res) => {

  try {

    const product =
      await Product.findOne({

        _id: req.params.id,

        userId: req.userId
      });

    if (!product) {

      return res.status(404).json({
        error: "Produit introuvable"
      });
    }

    Object.assign(product, req.body);

    product.priceTTC =
      Number(product.priceHT) *
      (1 + Number(product.tva) / 100);

    await product.save();

    res.json(product);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur modification produit"
    });
  }
});

// ================= DELETE PRODUCT =================

router.delete("/:id", auth, async (req, res) => {

  try {

    await Product.findOneAndDelete({

      _id: req.params.id,

      userId: req.userId
    });

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