const Invoice = require("../../models/invoice");

async function listDocuments(req, res) {
  try {
    const documents = await Invoice.find({ userId: req.userId })
      .populate("contactId", "firstname lastname companyName email")
      .populate("products.productId")
      .populate("sourceDocumentId", "invoiceNumber")
      .sort({ createdAt: -1 });

    return res.json(documents);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur récupération factures" });
  }
}

module.exports = { listDocuments };
