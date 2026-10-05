const express = require("express");

const auth = require("../middleware/auth");
const opportunityController = require("../controllers/opportunityController");

const router = express.Router();

router.get("/", auth, opportunityController.listOpportunities);
router.post("/", auth, opportunityController.createOpportunity);
router.put("/:id", auth, opportunityController.updateOpportunity);
router.put("/:id/stage", auth, opportunityController.updateOpportunityStage);
router.delete("/:id", auth, opportunityController.deleteOpportunity);

module.exports = router;
