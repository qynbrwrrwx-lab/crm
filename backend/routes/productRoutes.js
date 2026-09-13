const express = require("express");

const router = express.Router();

const Product = require("../models/product");
const StockMovement = require("../models/stockMovement");
const Invoice = require("../models/invoice");

const auth = require("../middleware/auth");

// ================= GET PRODUCTS =================

router.get("/", auth, async (req, res) => {

  try {

    const products =
      await Product.find({ userId: req.userId })
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

    const data = {
      ...req.body,
      userId: req.userId
    };

    if (!data.name?.trim()) {
      return res.status(400).json({
        error: "Le nom du produit est obligatoire"
      });
    }

    const priceHT = Number(data.priceHT);
    const tva = Number(data.tva ?? 20);
    const stock = Number(data.stock ?? 0);

    if (
      !Number.isFinite(priceHT) || priceHT < 0 ||
      !Number.isFinite(tva) || tva < 0 || tva > 100 ||
      !Number.isFinite(stock) || stock < 0
    ) {
      return res.status(400).json({
        error: "Prix, TVA ou stock invalide"
      });
    }

    data.priceHT = priceHT;
    data.tva = tva;
    data.stock = stock;

    data.priceTTC =
      priceHT * (1 + tva / 100);

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

// ================= RESTOCK =================

router.patch("/:id/stock", auth, async (req, res) => {

  try {

    const quantity = Number(req.body.quantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        error: "La quantité à ajouter doit être un entier positif"
      });
    }

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId
      },
      { $inc: { stock: quantity } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        error: "Produit introuvable"
      });
    }

    await StockMovement.create({
      userId: req.userId,
      productId: product._id,
      quantity,
      type: "restock"
    });

    res.json(product);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur lors de la mise à jour du stock"
    });
  }
});

// ================= UPDATE PRODUCT =================

router.put("/:id", auth, async (req, res) => {
  try {
    const { name, reference, description, priceHT, tva } = req.body;
    const price = Number(priceHT);
    const tax = Number(tva ?? 20);

    if (!name?.trim() || !Number.isFinite(price) || price < 0 || !Number.isFinite(tax) || tax < 0 || tax > 100) {
      return res.status(400).json({ error: "Produit, prix ou TVA invalide" });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name: name.trim(), reference, description, priceHT: price, tva: tax, priceTTC: price * (1 + tax / 100) },
      { new: true, runValidators: true }
    );

    if (!product) return res.status(404).json({ error: "Produit introuvable" });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur modification produit" });
  }
});

// ================= STOCK HISTORY =================

router.get("/:id/movements", auth, async (req, res) => {

  try {

    const product = await Product.exists({
      _id: req.params.id,
      userId: req.userId
    });

    if (!product) {
      return res.status(404).json({
        error: "Produit introuvable"
      });
    }

    const movements = await StockMovement.find({
      productId: req.params.id,
      userId: req.userId
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("documentId", "invoiceNumber");

    res.json(movements);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur lors de la récupération de l'historique"
    });
  }
});

// ================= DELETE PRODUCT =================

router.delete("/:id", auth, async (req, res) => {

  try {

    const usedInDocument = await Invoice.exists({
      userId: req.userId,
      "products.productId": req.params.id
    });

    const hasMovements = await StockMovement.exists({
      userId: req.userId,
      productId: req.params.id
    });

    if (usedInDocument || hasMovements) {
      return res.status(409).json({
        error: "Ce produit possède un historique et ne peut pas être supprimé"
      });
    }

    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!product) {
      return res.status(404).json({
        error: "Produit introuvable"
      });
    }

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
