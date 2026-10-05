const express = require("express");

const auth = require("../middleware/auth");
const purchaseOrderController = require("../controllers/purchaseOrderController");

const router = express.Router();

router.get("/", auth, purchaseOrderController.listPurchaseOrders);
router.post("/", auth, purchaseOrderController.createPurchaseOrder);
router.post("/:id/send", auth, purchaseOrderController.sendPurchaseOrder);
router.put("/:id/status", auth, purchaseOrderController.updatePurchaseOrderStatus);

module.exports = router;
