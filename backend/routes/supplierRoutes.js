const express = require("express");
const rateLimit = require("express-rate-limit");

const auth = require("../middleware/auth");
const supplierController = require("../controllers/supplierController");

const router = express.Router();
const restockEmailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyGenerator: req => String(req.userId),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de demandes de réassort envoyées. Réessayez dans quelques minutes." }
});

router.get("/", auth, supplierController.listSuppliers);
router.post("/", auth, supplierController.createSupplier);
router.put("/:id", auth, supplierController.updateSupplier);
router.post("/:id/send-restock-request", auth, restockEmailLimiter, supplierController.sendRestockRequest);
router.delete("/:id", auth, supplierController.deleteSupplier);

module.exports = router;
