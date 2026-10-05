const Product = require("../../models/product");

async function listProducts(req, res) {
  try {
    const products = await Product.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur récupération produits" });
  }
}

async function createProduct(req, res) {
  try {
    const data = { ...req.body, userId: req.userId };
    if (!data.name?.trim()) return res.status(400).json({ error: "Le nom du produit est obligatoire" });
    const priceHT = Number(data.priceHT);
    const purchasePriceHT = Number(data.purchasePriceHT ?? 0);
    const tva = Number(data.tva ?? 20);
    const stock = Number(data.stock ?? 0);
    const lowStockThreshold = Number(data.lowStockThreshold ?? 5);
    const category = String(data.category || "Non classé").trim() || "Non classé";
    const supplierName = String(data.supplierName || "").trim();
    const supplierReference = String(data.supplierReference || "").trim();
    const isInvalid = !Number.isFinite(priceHT) || priceHT < 0 || !Number.isFinite(purchasePriceHT) || purchasePriceHT < 0 || !Number.isFinite(tva) || tva < 0 || tva > 100 || !Number.isFinite(stock) || stock < 0 || !Number.isInteger(lowStockThreshold) || lowStockThreshold < 0 || category.length > 80 || supplierName.length > 120 || supplierReference.length > 80;
    if (isInvalid) return res.status(400).json({ error: "Prix, TVA, stock, catégorie, fournisseur ou seuil d'alerte invalide" });
    Object.assign(data, { priceHT, purchasePriceHT, tva, stock, lowStockThreshold, category, supplierName, supplierReference, priceTTC: priceHT * (1 + tva / 100) });
    const product = await Product.create(data);
    return res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur création produit" });
  }
}

async function updateProduct(req, res) {
  try {
    const { name, reference, description, priceHT, purchasePriceHT, tva, category, lowStockThreshold, supplierName, supplierReference } = req.body;
    const price = Number(priceHT);
    const purchasePrice = Number(purchasePriceHT ?? 0);
    const tax = Number(tva ?? 20);
    const threshold = Number(lowStockThreshold ?? 5);
    const normalizedCategory = String(category || "Non classé").trim() || "Non classé";
    const normalizedSupplierName = String(supplierName || "").trim();
    const normalizedSupplierReference = String(supplierReference || "").trim();
    const isInvalid = !name?.trim() || !Number.isFinite(price) || price < 0 || !Number.isFinite(purchasePrice) || purchasePrice < 0 || !Number.isFinite(tax) || tax < 0 || tax > 100 || !Number.isInteger(threshold) || threshold < 0 || normalizedCategory.length > 80 || normalizedSupplierName.length > 120 || normalizedSupplierReference.length > 80;
    if (isInvalid) return res.status(400).json({ error: "Produit, prix, TVA, catégorie, fournisseur ou seuil invalide" });
    const product = await Product.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, { name: name.trim(), reference, description, category: normalizedCategory, supplierName: normalizedSupplierName, supplierReference: normalizedSupplierReference, lowStockThreshold: threshold, priceHT: price, purchasePriceHT: purchasePrice, tva: tax, priceTTC: price * (1 + tax / 100) }, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ error: "Produit introuvable" });
    return res.json(product);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur modification produit" });
  }
}

module.exports = { createProduct, listProducts, updateProduct };
