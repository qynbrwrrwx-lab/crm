const express = require("express");

const auth = require("../middleware/auth");
const treasuryController = require("../controllers/treasuryController");

const router = express.Router();

router.get("/", auth, treasuryController.getTreasury);
router.put("/settings", auth, treasuryController.updateSettings);
router.post("/entries", auth, treasuryController.createEntry);
router.post("/entries/import", auth, treasuryController.importEntries);
router.put("/entries/:id", auth, treasuryController.updateEntry);
router.delete("/entries/:id", auth, treasuryController.deleteEntry);

module.exports = router;
