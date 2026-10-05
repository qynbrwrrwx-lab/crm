const express = require("express");

const auth = require("../middleware/auth");
const productController = require("../controllers/productController");

const router = express.Router();

// Les URLs sont conservées afin de préserver les intégrations existantes.
router.get("/", auth, productController.listProducts);
router.post("/", auth, productController.createProduct);
router.patch("/:id/stock", auth, productController.restockProduct);
router.put("/:id", auth, productController.updateProduct);
router.get("/:id/movements", auth, productController.listStockMovements);
router.delete("/:id", auth, productController.deleteProduct);

module.exports = router;
