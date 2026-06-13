const express = require("express");

const router = express.Router();
const PDFDocument = require("pdfkit");
const Invoice = require("../models/invoice");
const Contact = require("../models/contact");
const Product = require("../models/product");
const Company = require("../models/companyModel");

const auth = require("../middleware/auth");

// ================= GET INVOICES =================

router.get("/", auth, async (req, res) => {

  try {

    const invoices =
      await Invoice.find()
      .sort({ createdAt: -1 });

    res.json(invoices);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur récupération factures"
    });
  }
});

// ================= CREATE INVOICE =================

router.post("/", auth, async (req, res) => {

  try {

    const {
      type,
      contactId,
      paymentMethod,
      products
    } = req.body;

    // CONTACT
    const contact =
      await Contact.findById(contactId);

    if (!contact) {

      return res.status(404).json({
        error: "Contact introuvable"
      });
    }

    let totalHT = 0;
    let totalTTC = 0;

    const populatedProducts = [];

    // PRODUCTS
    for (const item of products) {

      const product =
        await Product.findById(
          item.productId
        );

      if (!product) {

        return res.status(404).json({
          error: "Produit introuvable"
        });
      }

      const lineHT =
        Number(product.priceHT) *
        Number(item.quantity);

      const lineTTC =
        Number(product.priceTTC) *
        Number(item.quantity);

      totalHT += lineHT;
      totalTTC += lineTTC;

      populatedProducts.push({
        productId: product._id,
        quantity: item.quantity
      });

      // UPDATE STOCK
      product.stock -= item.quantity;

      await product.save();
    }

    const year =
      new Date().getFullYear();

    let prefix = "FAC";

      if (type === "quote") {
    prefix = "DEV";
    }

    if (type === "order") {
      prefix = "CMD";
    }

    const count =
      await Invoice.countDocuments({
      type,
      createdAt: {
      $gte: new Date(`${year}-01-01`),
      $lt: new Date(`${year + 1}-01-01`)
    }
  });

    const invoiceNumber =
     `${prefix}-${year}-${String(count + 1).padStart(5, "0")}`;

    const invoice =
      await Invoice.create({

        invoiceNumber,

        type,

        contactId,

        products: populatedProducts,

        totalHT,

        totalTTC,

        paymentMethod,

        paymentStatus: "pending"
      });

    res.json(invoice);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur création facture"
    });
  }
});

// ================= MARK PAID =================

router.put(
  "/pay/:id",
  auth,
  async (req, res) => {

    try {

      const invoice =
        await Invoice.findById(
          req.params.id
        );

      if (!invoice) {

        return res.status(404).json({
          error: "Facture introuvable"
        });
      }

      invoice.paymentStatus =
        "paid";

      await invoice.save();

      res.json(invoice);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Erreur paiement"
      });
    }
  }
);

// ================= DELETE INVOICE =================

router.delete(
  "/:id",
  auth,
  async (req, res) => {

    try {

      await Invoice.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Erreur suppression facture"
      });
    }
  }
);

// ================= ACCEPT QUOTE =================

router.put(
  "/accept/:id",
  auth,
  async (req, res) => {

    try {

      const invoice =
        await Invoice.findById(req.params.id);

      if (!invoice) {

        return res.status(404).json({
          error: "Devis introuvable"
        });
      }

      invoice.status = "accepted";

      await invoice.save();

      res.json(invoice);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Erreur validation devis"
      });
    }
  }
);

// ================= PDF =================

router.get(
  "/pdf/:id",

  async (req, res) => {

    try {

      const invoice =
        await Invoice.findById(req.params.id);

      const company =
        await Company.findOne();  

      const contact =
        await Contact.findById(
          invoice.contactId
      );

      if (!invoice) {

        return res.status(404).send(
          "Document introuvable"
        );
      }

      const doc =
  new PDFDocument({
    margin: 50
  });

res.setHeader(
  "Content-Type",
  "application/pdf"
);

res.setHeader(
  "Content-Disposition",
  `inline; filename="${invoice.invoiceNumber}.pdf"`
);

doc.pipe(res);

// ENTREPRISE

doc
  .fontSize(22)
  .text(
    company?.companyName || "Entreprise",
    50,
    50
  );

doc
  .fontSize(10)
  .text(
    company?.address || "",
    50,
    80
  );

doc.text(
  `${company?.postalCode || ""} ${company?.city || ""}`,
  50,
  95
);

doc.text(
  company?.email || "",
  50,
  110
);

doc.text(
  company?.phone || "",
  50,
  125
);

doc.text(
  company?.website || "",
  50,
  140
);

// DOCUMENT

const documentTitle =
  invoice.type === "quote"
    ? "DEVIS"
    : invoice.type === "order"
    ? "COMMANDE"
    : "FACTURE";

doc
  .fontSize(22)
  .text(
    documentTitle,
    380,
    50
  );

doc
  .fontSize(12)
  .text(
    invoice.invoiceNumber,
    380,
    80
  );

doc
  .fontSize(10)
  .text(
    `Date : ${new Date(
      invoice.createdAt
    ).toLocaleDateString("fr-FR")}`,
    380,
    105
  );

  // CLIENT

doc
  .fontSize(14)
  .text(
    "CLIENT",
    350,
    160
  );

doc
  .fontSize(10)
  .text(
    `${contact?.firstname || ""} ${contact?.lastname || ""}`,
    350,
    185
  );

doc.text(
  contact?.companyName || "",
  350,
  200
);

doc.text(
  contact?.billingAddress || "",
  350,
  215,
  {
    width: 200
  }
);

doc.text(
  contact?.email || "",
  350,
  250
);

doc.text(
  contact?.phone || "",
  350,
  265
);

doc.end();

      
    } catch (err) {

      console.error(err);

      res.status(500).send(
        "Erreur PDF"
      );
    }
  }
);

// ================= UPDATE INVOICE =================

router.put(
  "/:id",
  auth,
  async (req, res) => {

    try {

      const {
        contactId,
        products
      } = req.body;

      const invoice =
        await Invoice.findById(req.params.id);

      if (!invoice) {

        return res.status(404).json({
          error: "Document introuvable"
        });
      }

      invoice.contactId =
        contactId;

      invoice.products =
        products;

      await invoice.save();

      res.json(invoice);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Erreur modification document"
      });
    }
  }
);

module.exports = router;