const Product = require("../../models/product");
const StockMovement = require("../../models/stockMovement");
const Invoice = require("../../models/invoice");

async function restockProduct(req, res) {
  try {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) return res.status(400).json({ error: "La quantité à ajouter doit être un entier positif" });
    const product = await Product.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, { $inc: { stock: quantity } }, { new: true });
    if (!product) return res.status(404).json({ error: "Produit introuvable" });
    await StockMovement.create({ userId: req.userId, productId: product._id, quantity, type: "restock" });
    return res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la mise à jour du stock" });
  }
}

async function listStockMovements(req, res) {
  try {
    const product = await Product.exists({ _id: req.params.id, userId: req.userId });
    if (!product) return res.status(404).json({ error: "Produit introuvable" });
    const movements = await StockMovement.find({ productId: req.params.id, userId: req.userId }).sort({ createdAt: -1 }).limit(20).populate("documentId", "invoiceNumber");
    return res.json(movements);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la récupération de l'historique" });
  }
}

async function deleteProduct(req, res) {
  try {
    const [usedInDocument, hasMovements] = await Promise.all([Invoice.exists({ userId: req.userId, "products.productId": req.params.id }), StockMovement.exists({ userId: req.userId, productId: req.params.id })]);
    if (usedInDocument || hasMovements) return res.status(409).json({ error: "Ce produit possède un historique et ne peut pas être supprimé" });
    const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!product) return res.status(404).json({ error: "Produit introuvable" });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur suppression produit" });
  }
}

module.exports = { deleteProduct, listStockMovements, restockProduct };
