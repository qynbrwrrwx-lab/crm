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

      populatedProducts.push({
        productId: product._id,
        quantity: item.quantity,
        discount: item.discount || 0
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

        let logoBuffer = null;

if (company?.logo) {

  try {

    const base64Data =
      company.logo.replace(
        /^data:image\/\w+;base64,/,
        ""
      );

    logoBuffer =
      Buffer.from(
        base64Data,
        "base64"
      );

  } catch (err) {

    console.error(
      "Erreur logo PDF :",
      err
    );

  }

}

      const contact =
  await Contact.findById(
    invoice.contactId
  );

      const invoiceProducts = [];

for (const item of invoice.products) {

      const product =
    await Product.findById(
      item.productId
    );

  if (product) {

    invoiceProducts.push({
  name: product.name,
  priceHT: product.priceHT,
  quantity: item.quantity,
  discount: item.discount || 0,
  totalHT:
    Number(product.priceHT) *
    Number(item.quantity) *
    (1 - (item.discount || 0) / 100)
});

  }

}
    
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

if (logoBuffer) {

  doc.image(
    logoBuffer,
    70,
    25,
    {
      fit: [130, 130],
    }
  );

}


doc
  .fontSize(13)
  .font("Helvetica-Bold")
  .text(
    company?.companyName || "Entreprise",
    70,
    105
  );

doc
  .fontSize(10)
  .font("Helvetica")
  .text(
    company?.address || "",
    70,
    130
  );

doc.text(
  `${company?.postalCode || ""} ${company?.city || ""}`,
  70,
  145
);

doc.text(
  company?.email || "",
  70,
  160
);

doc.text(
  company?.phone || "",
  70,
  175
);

doc.text(
  company?.website || "",
  70,
  190
);

// DOCUMENT

const documentTitle =
  invoice.type === "quote"
    ? "DEVIS"
    : invoice.type === "order"
    ? "COMMANDE"
    : "FACTURE";

doc
  .fontSize(13)
  .font("Helvetica-Bold")
  .text(
    `${documentTitle} ${invoice.invoiceNumber}`,
    330,
    40
  );

doc
  .fontSize(10)
  .text(
    `Date : ${new Date(
      invoice.createdAt
    ).toLocaleDateString("fr-FR")}`,
    330,
    60
  );

  // CLIENT

doc
  .fontSize(13)
  .font("Helvetica-Bold")
  .text(
    "CLIENT",
    330,
    105
  );

doc
  .fontSize(10)
  .font("Helvetica-Bold")
  .text(
    `${contact?.firstname || ""} ${contact?.lastname || ""}`,
    330,
    130
  );

doc.text(
  contact?.companyName || "",
  330,
  145
);

doc.text(
  contact?.billingAddress || "",
  330,
  160,
  {
    width: 200
  }
);

doc.text(
  contact?.email || "",
  330,
  175
);

doc.text(
  contact?.phone || "",
  330,
  190
);

// PRODUITS

let y = 270;

doc
  .fontSize(11)
  .font("Helvetica-Bold");

doc.text("Produit", 50, y);

doc.text("Qté", 220, y);

doc.text("PU HT", 290, y);

doc.text("Remise", 390, y)

doc.text("Total HT", 470, y);

doc.font("Helvetica");

doc.moveTo(50, y + 20)
   .lineTo(550, y + 20)
   .stroke();

y += 35;

invoiceProducts.forEach(product => {

  doc.text(
    product.name,
    50,
    y
  );

  doc.text(
    String(product.quantity),
    220,
    y
  );

  doc.text(
    `${Number(product.priceHT).toFixed(2)} €`,
    290,
    y
  );

  doc.text(
    `${product.discount}%`,
    390,
    y
  );

  doc.text(
    `${Number(product.totalHT).toFixed(2)} €`,
    470,
    y
  );

  y += 25;

});

y += 30;

doc.moveTo(300, y)
   .lineTo(550, y)
   .stroke();

y += 20;

doc.fontSize(11);

doc.text(
  `Total HT : ${Number(invoice.totalHT).toFixed(2)} €`,
  350,
  y
);

y += 20;

doc.text(
  `TVA : ${Number(invoice.totalTTC - invoice.totalHT).toFixed(2)} €`,
  350,
  y
);

y += 20;

doc.fontSize(13);

doc.text(
  `TOTAL TTC : ${Number(invoice.totalTTC).toFixed(2)} €`,
  350,
  y
);

y += 30;

doc
  .moveTo(320, y)
  .lineTo(550, y)
  .stroke();

y += 20;



// COORDONNÉES BANCAIRES

doc
  .fontSize(13)
  .text(
    "Coordonnées bancaires",
    50,
    y
  );

y += 25;

doc
  .fontSize(10)
  .text(
    `Banque : ${company?.companyBank || ""}`,
    50,
    y
  );

y += 15;

doc.text(
  `IBAN : ${company?.companyIban || ""}`,
  50,
  y
);

y += 15;

doc.text(
  `BIC : ${company?.companyBic || ""}`,
  50,
  y
);

y += 15;

doc.text(
  `Titulaire : ${company?.companyAccountHolder || ""}`,
  50,
  y
);

y += 50;

doc.moveTo(50, y)
   .lineTo(550, y)
   .stroke();

y += 20;

// MENTIONS LÉGALES

doc
  .fontSize(12)
  .text(
    "Mentions légales",
    50,
    y
  );

y += 20;

doc
  .fontSize(9)
  .text(
    company?.legalMentions ||
    "Paiement selon les conditions convenues entre les parties.",
    50,
    y,
    {
      width: 500
    }
  );

y += 40;

// CONDITIONS DE RÈGLEMENT

doc.text(
  `Conditions de règlement : ${company?.deliveryTerms || "30 jours"}`,
  50,
  y
);

y += 35;

// PIED DE PAGE SOCIÉTÉ

doc
  .fontSize(8)
  .text(
    `${company?.companyName || ""} | SIRET : ${company?.siret || ""} | RCS : ${company?.rcs || ""} | APE : ${company?.ape || ""}`,
    50,
    y,
    {
      width: 500,
      align: "center"
    }
  );

y += 15;

doc.text(
  `TVA : ${company?.vatNumber || ""} | Capital social : ${company?.capitalSocial || ""}`,
  50,
  y,
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