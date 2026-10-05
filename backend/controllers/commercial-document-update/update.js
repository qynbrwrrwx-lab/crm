const Invoice = require("../../models/invoice");
const Contact = require("../../models/contact");
const Product = require("../../models/product");

async function updateCommercialDocument(req, res) {

    try {

      const {
        contactId,
        products
      } = req.body;

      let totalHT = 0;
      let totalTTC = 0;
      const updatedProducts = [];

      const invoice =
        await Invoice.findOne({
          _id: req.params.id,
          userId: req.userId
        });

      if (!invoice) {

        return res.status(404).json({
          error: "Document introuvable"
        });
      }

      if (invoice.type !== "quote" || invoice.status === "accepted") {
        return res.status(409).json({
          error: "Seul un devis non accepté peut être modifié"
        });
      }

      const contact = await Contact.findOne({
        _id: contactId,
        userId: req.userId
      });

      if (!contact) {
        return res.status(404).json({
          error: "Contact introuvable"
        });
      }

      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          error: "Ajoutez au moins un produit"
        });
      }

      invoice.contactId = contactId;

    for (const item of products) {

  const product =
    await Product.findOne({
      _id: item.productId,
      userId: req.userId
    });

  if (!product) {
    return res.status(404).json({
      error: "Produit introuvable"
    });
  }

  if (
    !Number.isFinite(Number(item.quantity)) ||
    Number(item.quantity) <= 0 ||
    !Number.isFinite(Number(item.discount || 0)) ||
    Number(item.discount || 0) < 0 ||
    Number(item.discount || 0) > 100
  ) {
    return res.status(400).json({
      error: "Quantité ou remise invalide"
    });
  }

  const discount =
    Number(item.discount || 0);

  const lineHTBeforeDiscount =
    Number(product.priceHT) *
    Number(item.quantity);

  const lineHT =
    lineHTBeforeDiscount *
    (1 - discount / 100);

  const lineTTC =
    lineHT *
    (1 + Number(product.tva || 20) / 100);

  totalHT += lineHT;
  totalTTC += lineTTC;

  updatedProducts.push({
    productId: product._id,
    quantity: item.quantity,
    discount,
    productName: product.name,
    unitHT: Number(product.priceHT),
    unitTTC: Number(product.priceHT) * (1 + Number(product.tva || 20) / 100),
    tva: Number(product.tva || 20),
    lineHT,
    lineTTC
  });
}

invoice.products = updatedProducts;

invoice.totalHT = totalHT;
invoice.totalTTC = totalTTC;

await invoice.save();

      res.json(invoice);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Erreur modification document"
      });
    }
}

module.exports = { updateCommercialDocument };
