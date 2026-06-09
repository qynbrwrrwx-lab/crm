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

      if (!invoice) {

        return res.status(404).send(
          "Document introuvable"
        );
      }

      const doc =
        new PDFDocument();

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${invoice.invoiceNumber}.pdf"`
      );

      doc.pipe(res);

      doc.fontSize(24)
   .text(
     company?.companyName || "Entreprise",
     50,
     50
   );

      doc.fontSize(11)
  .text(
     company?.address || "",
     50,
     90
   );

      doc.text(
     `${company?.postalCode || ""} ${company?.city || ""}`,
     50,
     105
   );

      doc.text(
     company?.email || "",
     50,
     120
   );

      doc.text(
     company?.phone || "",
     50,
     135
   );

      doc.text(
     company?.website || "",
     50,
     150
   );

      doc.fontSize(20)
   .text(
     invoice.invoiceNumber,
     350,
     50
   );

      doc.fontSize(14)
   .text(
     invoice.type === "quote"
       ? "DEVIS"
       : invoice.type === "order"
       ? "COMMANDE"
       : "FACTURE",
     350,
     80
   );

      const contact =
  await Contact.findById(
    invoice.contactId
  );

      doc.fontSize(14)
   .text(
     "CLIENT",
     350,
     140
   );

      doc.fontSize(11)
   .text(
     `${contact?.firstname || ""} ${contact?.lastname || ""}`,
     350,
     165
   );

      doc.text(
     contact?.companyName || "",
     350,
     180
   );

      doc.text(
     contact?.billingAddress || "",
     350,
     195
   );

      doc.fontSize(11)
   .text(
     "Date d'émission",
     50,
     210
   );

      doc.text(
     new Date(invoice.createdAt)
       .toLocaleDateString("fr-FR"),
     50,
     225
   );

      doc.text(
     "Date de livraison",
     200,
     210
   );

      doc.text(
     new Date(invoice.createdAt)
       .toLocaleDateString("fr-FR"),
     200,
     225
   );
      doc.moveTo(50, 280)
   .lineTo(550, 280)
   .stroke();

      doc.fontSize(11);

      doc.text("Article", 50, 290);

      doc.text("Qté", 250, 290);

      doc.text("TVA", 320, 290);

      doc.text("PU HT", 390, 290);

      doc.text("Total HT", 480, 290);

      doc.moveTo(50, 310)
   .lineTo(550, 310)
   .stroke();

      let y = 325;

for (const item of invoice.products) {

  const product =
    await Product.findById(
      item.productId
    );

  if (!product) continue;

  const totalLine =
    Number(product.priceHT) *
    Number(item.quantity);

      doc.text(
    product.name,
    50,
    y
  );

      doc.text(
    String(item.quantity),
    250,
    y
  );

      doc.text(
    `${product.tva || 20}%`,
    320,
    y
  );

      doc.text(
    `${Number(product.priceHT).toFixed(2)} €`,
    390,
    y
  );

      doc.text(
    `${totalLine.toFixed(2)} €`,
    480,
    y
  );

  y += 25;
}

    doc.moveTo(350, y + 20)
   .lineTo(550, y + 20)
   .stroke();

      doc.fontSize(11)

   .text(
     `Total HT : ${Number(invoice.totalHT).toFixed(2)} €`,
     380,
     y + 40
   )

   .text(
     `TVA : ${(invoice.totalTTC - invoice.totalHT).toFixed(2)} €`,
     380,
     y + 60
   );

      doc.fontSize(13)

   .text(
     `TOTAL TTC : ${Number(invoice.totalTTC).toFixed(2)} €`,
     380,
     y + 90
   );

      doc.moveTo(50, y + 150)
   .lineTo(550, y + 150)
   .stroke();

      doc.fontSize(12)
   .text(
     "Coordonnées bancaires",
     50,
     y + 170
   );

      doc.fontSize(10)

   .text(
     `Banque : ${company?.companyBank || ""}`,
     50,
     y + 195
   )

   .text(
     `IBAN : ${company?.companyIban || ""}`,
     50,
     y + 215
   )

   .text(
     `BIC : ${company?.companyBic || ""}`,
     50,
     y + 235
   )

   .text(
     `Titulaire : ${company?.companyAccountHolder || ""}`,
     50,
     y + 255
   );

      doc.moveTo(50, y + 300)
   .lineTo(550, y + 300)
   .stroke();

      doc.fontSize(12)
   .text(
     "Mentions légales",
     50,
     y + 320
   );

      doc.fontSize(9)
   .text(
     company?.legalMentions ||
     "Paiement selon les conditions convenues entre les parties.",
     50,
     y + 345,
     {
       width: 500
     }
   );

      doc.text(
     `Conditions de règlement : ${company?.deliveryTerms || "30 jours"}`,
     50,
     y + 390
   );

      doc.moveTo(50, 730)
   .lineTo(550, 730)
   .stroke();

    doc.fontSize(7);

    doc.text(
  `${company?.companyName || ""}`,
  50,
  740,
  {
    width: 500,
    align: "center"
  }
);

    doc.text(
  `SIRET : ${company?.siret || ""} | RCS : ${company?.rcs || ""} | APE : ${company?.ape || ""}`,
  50,
  752,
  {
    width: 500,
    align: "center"
  }
);

    doc.text(
  `TVA : ${company?.vatNumber || ""} | Capital social : ${company?.capitalSocial || ""}`,
  50,
  764,
  {
    width: 500,
    align: "center"
  }
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