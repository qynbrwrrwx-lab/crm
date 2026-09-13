const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();
const PDFDocument = require("pdfkit");
const Invoice = require("../models/invoice");
const Contact = require("../models/contact");
const Product = require("../models/product");
const Company = require("../models/companyModel");
const StockMovement = require("../models/stockMovement");
const { sendInvoiceEmail } = require("../services/emailService");
const { recordAuditEvent } = require("../services/auditService");

const auth = require("../middleware/auth");

const documentEmailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyGenerator: req => String(req.userId),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop d'envois d'e-mails. Réessayez dans quelques minutes." }
});

function createEmailPdf(invoice, contact, company) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const title = invoice.type === "quote" ? "DEVIS" : "FACTURE";
    doc.fontSize(20).text(`${title} ${invoice.invoiceNumber}`);
    doc.moveDown();
    doc.fontSize(11).text(company?.companyName || "Mon entreprise");
    doc.text(company?.address || "");
    doc.text(`${company?.postalCode || ""} ${company?.city || ""}`.trim());
    doc.text(company?.email || "");
    doc.text(company?.phone || "");
    doc.text(`SIRET : ${company?.siret || ""}`);
    doc.moveDown();
    doc.font("Helvetica-Bold").text("Client");
    doc.font("Helvetica").text(
      [contact?.firstname, contact?.lastname].filter(Boolean).join(" ") ||
      contact?.companyName || "Client"
    );
    doc.text(contact?.companyName || "");
    doc.text(contact?.billingAddress || "");
    doc.text(contact?.email || "");
    doc.moveDown();
    doc.text(`Date : ${new Date(invoice.createdAt).toLocaleDateString("fr-FR")}`);
    if (invoice.type === "quote") {
      doc.text(`Validité : ${company?.quoteValidity || 30} jours`);
    }
    doc.moveDown();
    doc.font("Helvetica-Bold").text("Articles");
    doc.font("Helvetica");
    invoice.products.forEach(item => {
      const quantity = Number(item.quantity || 0);
      const unitHT = Number(item.unitHT || 0);
      const lineHT = Number(item.lineHT ?? unitHT * quantity);
      doc.text(`${item.productName || "Produit"} — ${quantity} × ${unitHT.toFixed(2)} HT = ${lineHT.toFixed(2)} HT`);
    });
    doc.moveDown();
    doc.text(`Total HT : ${Number(invoice.totalHT || 0).toFixed(2)} €`);
    doc.font("Helvetica-Bold").text(`Total TTC : ${Number(invoice.totalTTC || 0).toFixed(2)} €`);
    doc.moveDown();
    doc.font("Helvetica").text(`Conditions de règlement : ${company?.deliveryTerms || "30 jours"}`);
    doc.text(company?.legalMentions || "Paiement selon les conditions convenues entre les parties.");
    doc.end();
  });
}

async function requireCompanyConfiguration(req, res) {
  const company = await Company.findOne({ userId: req.userId });
  const requiredFields = [
    company?.companyName,
    company?.siret,
    company?.email,
    company?.address,
    company?.city
  ];

  if (!requiredFields.every(value => String(value || "").trim())) {
    res.status(400).json({
      error: "Complétez les informations de votre entreprise avant de créer un document"
    });
    return null;
  }

  return company;
}

// ================= GET INVOICES =================

router.get("/", auth, async (req, res) => {

  try {

  const invoices =
    await Invoice.find({ userId: req.userId })
    .populate(
      "contactId",
      "firstname lastname companyName"
    )
    .populate(
      "products.productId"
    )
    
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

    if (!(await requireCompanyConfiguration(req, res))) return;

  const {
      type,
      contactId,
      paymentMethod,
      products
    } = req.body;

    // CONTACT
    const contact =
      await Contact.findOne({
        _id: contactId,
        userId: req.userId
      });

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
        await Product.findOne({
          _id: item.productId,
          userId: req.userId
        });

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
        discount: item.discount || 0,
        productName: product.name,
        unitHT: Number(product.priceHT),
        unitTTC: Number(product.priceHT) * (1 + Number(product.tva || 20) / 100),
        tva: Number(product.tva || 20),
        lineHT,
        lineTTC
      });
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
      userId: req.userId,
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

        userId: req.userId,

        type,

        contactId,

        products: populatedProducts,

        totalHT,

        totalTTC,

        paymentMethod,

        paymentStatus: "pending"
      });

    await recordAuditEvent({
      userId: req.userId,
      action: "document.created",
      documentId: invoice._id,
      metadata: { invoiceNumber, type }
    });

    res.json(invoice);

  } catch (err) {

    console.error(err);

    if (err.code === 11000) {
      return res.status(409).json({
        error: "Un numéro de document identique existe déjà. Réessayez."
      });
    }

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

      const {
        paymentMethod
      } = req.body;

      const invoice =
        await Invoice.findOne({
          _id: req.params.id,
          userId: req.userId
        });

      if (!invoice) {

        return res.status(404).json({
          error: "Facture introuvable"
        });
      }

      if (invoice.type !== "invoice") {

        return res.status(400).json({
          error: "Ce document n'est pas une facture"
        });
      }

      if (invoice.paymentStatus === "paid") {

        return res.status(400).json({
          error: "Cette facture est déjà payée"
        });
      }

      if (!paymentMethod) {

        return res.status(400).json({
          error: "Le moyen de paiement est obligatoire"
        });
      }

      const allowedPaymentMethods = [
        "Espèces",
        "Carte bancaire",
        "Chèque",
        "Virement bancaire"
      ];

      if (!allowedPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
          error: "Moyen de paiement invalide"
        });
      }

      invoice.paymentStatus =
        "paid";

      invoice.paymentMethod =
        paymentMethod;

      invoice.paidAt = new Date();

      await invoice.save();

      await recordAuditEvent({
        userId: req.userId,
        action: "invoice.paid",
        documentId: invoice._id,
        metadata: { invoiceNumber: invoice.invoiceNumber, paymentMethod }
      });

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

      const invoice = await Invoice.findOne({
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
          error: "Seul un devis non accepté peut être supprimé"
        });
      }

      await invoice.deleteOne();

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
        await Invoice.findOne({
          _id: req.params.id,
          userId: req.userId
        });

      if (!invoice) {

        return res.status(404).json({
          error: "Devis introuvable"
        });
      }

      if (invoice.type !== "quote" || invoice.status === "accepted") {
        return res.status(409).json({
          error: "Seul un devis en attente peut être accepté"
        });
      }

      invoice.status = "accepted";

      await invoice.save();

      await recordAuditEvent({
        userId: req.userId,
        action: "quote.accepted",
        documentId: invoice._id,
        metadata: { invoiceNumber: invoice.invoiceNumber }
      });

      res.json(invoice);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Erreur validation devis"
      });
    }
  }
);

// ================= CONVERT QUOTE TO ORDER =================

router.post(
  "/convert-to-order/:id",
  auth,
  async (req, res) => {

    try {

      // Récupérer le devis
      const quote =
        await Invoice.findOne({
          _id: req.params.id,
          userId: req.userId
        });

      if (!quote) {

        return res.status(404).json({
          error: "Devis introuvable"
        });

      }

      // Vérifier que c'est bien un devis
      if (quote.type !== "quote") {

        return res.status(400).json({
          error: "Ce document n'est pas un devis"
        });

      }

      // Vérifier que le devis est accepté
      if (quote.status !== "accepted") {

        return res.status(400).json({
          error: "Le devis doit être accepté avant de pouvoir être transformé en commande"
        });

      }

      // Empêcher une deuxième conversion
      if (quote.convertedToOrderId) {

        return res.status(400).json({
          error: "Ce devis a déjà été transformé en commande"
        });

      }

      // ================= STOCK =================

      for (const item of quote.products) {

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
          Number(product.stock) <
          Number(item.quantity)
        ) {

          return res.status(400).json({
            error:
              `Stock insuffisant pour le produit ${product.name}`
          });

        }

      }

      // ================= NUMÉRO COMMANDE =================

      const year =
        new Date().getFullYear();

      const count =
        await Invoice.countDocuments({
          userId: req.userId,
          type: "order",
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`)
          }
        });

      const orderNumber =
        `CMD-${year}-${String(count + 1).padStart(5, "0")}`;

      // ================= CRÉATION COMMANDE =================

      const order =
        await Invoice.create({

          invoiceNumber: orderNumber,

          userId: req.userId,

          type: "order",

          status: "draft",

          contactId: quote.contactId,

          sourceQuoteId: quote._id,

          products: quote.products.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            discount: item.discount || 0,
            productName: item.productName,
            unitHT: item.unitHT,
            unitTTC: item.unitTTC,
            tva: item.tva,
            lineHT: item.lineHT,
            lineTTC: item.lineTTC
          })),

          totalHT: quote.totalHT,

          totalTTC: quote.totalTTC,

          paymentMethod: "pending",

          paymentStatus: "pending"

        });

      // ================= MISE À JOUR STOCK =================

      const decrementedProducts = [];

      for (const item of quote.products) {

        const quantity = Number(item.quantity);

        const product = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            userId: req.userId,
            stock: { $gte: quantity }
          },
          { $inc: { stock: -quantity } },
          { new: true }
        );

        if (!product) {
          await Promise.all(
            decrementedProducts.map(({ productId, quantity: restoredQuantity }) =>
              Product.updateOne(
                { _id: productId, userId: req.userId },
                { $inc: { stock: restoredQuantity } }
              )
            )
          );

          await StockMovement.deleteMany({ documentId: order._id });

          await order.deleteOne();

          return res.status(409).json({
            error: "Stock insuffisant : la commande n'a pas été créée"
          });
        }

        decrementedProducts.push({
          productId: item.productId,
          quantity
        });

        await StockMovement.create({
          userId: req.userId,
          productId: item.productId,
          quantity: -quantity,
          type: "sale",
          documentId: order._id
        });

      }

      // ================= LIEN DEPUIS LE DEVIS =================

      quote.convertedToOrderId =
        order._id;

      await quote.save();

      res.json(order);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Erreur transformation du devis en commande"
      });

    }

  }
);

// ================= CONVERT ORDER TO INVOICE =================

router.post(
  "/convert-to-invoice/:id",
  auth,
  async (req, res) => {

    try {

      const order =
        await Invoice.findOne({
          _id: req.params.id,
          userId: req.userId
        });

      if (!order) {

        return res.status(404).json({
          error: "Commande introuvable"
        });

      }

      if (order.type !== "order") {

        return res.status(400).json({
          error: "Ce document n'est pas une commande"
        });

      }

      // Vérifier si la commande a déjà été facturée

if (order.convertedToInvoiceId) {

  return res.status(400).json({
    error:
      "Cette commande a déjà été transformée en facture"
  });

}

const existingInvoice =
  await Invoice.findOne({
    userId: req.userId,
    type: "invoice",
    sourceOrderId: order._id
  });

if (existingInvoice) {

  // Réparer le lien si nécessaire
  order.convertedToInvoiceId =
    existingInvoice._id;

  await order.save();

  return res.status(400).json({
    error:
      "Cette commande a déjà été transformée en facture"
  });

}

      const year =
        new Date().getFullYear();

      const count =
        await Invoice.countDocuments({
          userId: req.userId,
          type: "invoice",
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`)
          }
        });

      const invoiceNumber =
        `FAC-${year}-${String(count + 1).padStart(5, "0")}`;

      const invoice =
        await Invoice.create({

          invoiceNumber,

          userId: req.userId,

          type: "invoice",

          status: "draft",

          contactId: order.contactId,

          sourceOrderId: order._id,

          products: order.products.map(item => ({

            productId: item.productId,

            quantity: item.quantity,

            discount: item.discount || 0,
            productName: item.productName,
            unitHT: item.unitHT,
            unitTTC: item.unitTTC,
            tva: item.tva,
            lineHT: item.lineHT,
            lineTTC: item.lineTTC

          })),

          totalHT: order.totalHT,

          totalTTC: order.totalTTC,

          paymentMethod: "pending",

          paymentStatus: "pending"

        });

    order.convertedToInvoiceId =
  invoice._id;

await order.save();

      res.json(invoice);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error:
          "Erreur transformation de la commande en facture"
      });

    }

  }
);

// ================= PDF =================

router.post(
  "/:id/send-email",
  auth,
  documentEmailLimiter,
  async (req, res) => {
    let invoice;

    try {
      invoice = await Invoice.findOne({ _id: req.params.id, userId: req.userId });
      if (!invoice || !["quote", "invoice"].includes(invoice.type)) {
        return res.status(404).json({ error: "Document introuvable" });
      }

      const contact = await Contact.findOne({ _id: invoice.contactId, userId: req.userId });
      if (!contact?.email) {
        return res.status(400).json({ error: "Le contact ne possède pas d'adresse email" });
      }

      const company = await Company.findOne({ userId: req.userId });
      const sent = await sendInvoiceEmail({
        to: contact.email,
        invoice,
        pdfBuffer: await createEmailPdf(invoice, contact, company)
      });

      if (!sent) {
        invoice.emailStatus = "failed";
        invoice.emailFailedAt = new Date();
        await invoice.save();
        await recordAuditEvent({
          userId: req.userId,
          action: "document.email_failed",
          documentId: invoice._id,
          metadata: { invoiceNumber: invoice.invoiceNumber }
        });
        return res.status(502).json({ error: "L'email n'a pas pu être envoyé" });
      }

      invoice.emailSentAt = new Date();
      invoice.emailStatus = "sent";
      invoice.emailFailedAt = null;
      await invoice.save();
      await recordAuditEvent({
        userId: req.userId,
        action: "document.email_sent",
        documentId: invoice._id,
        metadata: { invoiceNumber: invoice.invoiceNumber }
      });
      res.json({ success: true, sentAt: invoice.emailSentAt });
    } catch (err) {
      console.error(err);
      if (invoice) {
        invoice.emailStatus = "failed";
        invoice.emailFailedAt = new Date();
        await invoice.save().catch(() => {});
        await recordAuditEvent({
          userId: req.userId,
          action: "document.email_failed",
          documentId: invoice._id,
          metadata: { invoiceNumber: invoice.invoiceNumber }
        });
      }
      res.status(500).json({ error: "Erreur lors de l'envoi de l'email" });
    }
  }
);

router.get(
  "/pdf/:id",

  auth,

  async (req, res) => {

    try {

      const invoice =
        await Invoice.findOne({
          _id: req.params.id,
          userId: req.userId
        });

      if (!invoice) {
        return res.status(404).send(
          "Document introuvable"
        );
      }

      const company =
        await Company.findOne({ userId: req.userId });

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
  await Contact.findOne({
    _id: invoice.contactId,
    userId: req.userId
  });

      const invoiceProducts = [];

for (const item of invoice.products) {

      const product =
    await Product.findOne({
      _id: item.productId,
      userId: req.userId
    });

  if (product) {

    invoiceProducts.push({
  name: item.productName || product.name,
  priceHT: item.unitHT ?? product.priceHT,
  quantity: item.quantity,
  discount: item.discount || 0,
  totalHT: item.lineHT ?? (
    Number(product.priceHT) *
    Number(item.quantity) *
    (1 - (item.discount || 0) / 100)
  )
});

  }

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

// COORDONÉES DE MISE EN PAGE

const LEFT_X = 70;
const RIGHT_X = 400;

// ENTREPRISE

if (logoBuffer) {

  doc.image(
    logoBuffer,
    LEFT_X,
    25,
    {
      fit: [150, 150],
    }
  );

}


doc
  .fontSize(10)
  .font("Helvetica-Bold")
  .text(
    company?.companyName || "Entreprise",
    LEFT_X,
    105
  );

doc
  .fontSize(10)
  .font("Helvetica")
  .text(
    company?.address || "",
    LEFT_X,
    120
  );

doc.text(
  `${company?.postalCode || ""} ${company?.city || ""}`,
  LEFT_X,
  135
);

doc.text(
  company?.email || "",
  LEFT_X,
  150
);

doc.text(
  company?.phone || "",
  LEFT_X,
  165
);

doc.text(
  company?.website || "",
  LEFT_X,
  180
);


// DOCUMENT

const documentTitle =
  invoice.type === "quote"
    ? "DEVIS"
    : invoice.type === "order"
    ? "COMMANDE"
    : "FACTURE";

const documentDateLabel =
  invoice.type === "quote"
    ? "Date du devis"
    : invoice.type === "order"
    ? "Date de la commande"
    : "Date de la facture";

doc
  .fontSize(12)
  .font("Helvetica-Bold")
  .text(
    `${documentTitle} ${invoice.invoiceNumber}`,
    RIGHT_X,
    40
  );

doc
  .fontSize(10)
  .text(
    `${documentDateLabel} : ${new Date(
      invoice.createdAt
    ).toLocaleDateString("fr-FR")}`,
    RIGHT_X,
    55
  );

if (invoice.type === "quote") {
  doc.fontSize(10).text(
    `Validité : ${company?.quoteValidity || 30} jours`,
    RIGHT_X,
    65
  );
}

if (invoice.type === "order") {
  doc.fontSize(10).text(
    "Livraison : À définir",
    RIGHT_X,
    65
  );
}

if (invoice.type === "invoice") {
  const paymentText = invoice.paymentStatus === "paid"
    ? `Paiement : Payée · ${invoice.paymentMethod}`
    : "Paiement : En attente";

  doc.fontSize(10).text(paymentText, RIGHT_X, 65);

  if (invoice.paidAt) {
    doc.text(
      `Réglée le : ${new Date(invoice.paidAt).toLocaleDateString("fr-FR")}`,
      RIGHT_X,
      80
    );
  }
}

  // CLIENT

doc
  .fontSize(10)
  .font("Helvetica-Bold")
  .text(
    "CLIENT",
    RIGHT_X,
    105
  );

doc
  .fontSize(10)
  .font("Helvetica-Bold")
  .text(
    `${contact?.firstname || ""} ${contact?.lastname || ""}`,
    RIGHT_X,
    120
  );

doc.text(
  contact?.companyName || "",
  RIGHT_X,
  135
);

doc.text(
  contact?.billingAddress || "",
  RIGHT_X,
  150,
  {
    width: 200
  }
);

doc.text(
  contact?.email || "",
  RIGHT_X,
  165
);

doc.text(
  contact?.phone || "",
  RIGHT_X,
  180
);

doc.moveTo(50, 205)
   .lineTo(550, 205)
   .stroke();

// PRODUITS

let y = 230;

doc
  .fontSize(10)
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
    430,
    y,
    {
      width: 80,
      align: "right"
    }

  );

  y += 20;

});

y += 10;

doc.fontSize(10);

// BLOC TOTAUX

doc.moveTo(300, y -10)
    .lineTo(550, y -10)
    .stroke();

const totalBoxX = 310;
const totalBoxY = y;
const totalBoxWidth = 240;
const totalBoxHeight = 95;

doc.rect(
  totalBoxX,
  totalBoxY,
  totalBoxWidth,
  totalBoxHeight
).stroke();

doc
  .fontSize(10)
  .font("Helvetica");

doc.text(
  "Total HT :",
  totalBoxX + 15,
  totalBoxY + 12
);

doc.text(
  `${Number(invoice.totalHT).toFixed(2)} €`,
  totalBoxX + 120,
  totalBoxY + 12,
  {
    width: 90,
    align: "right"
  }
);

doc.text(
  "TVA :",
  totalBoxX + 15,
  totalBoxY + 32
);

doc.text(
  `${Number(invoice.totalTTC - invoice.totalHT).toFixed(2)} €`,
  totalBoxX + 120,
  totalBoxY + 32,
  {
    width: 90,
    align: "right"
  }
);

doc
  .fontSize(14)
  .font("Helvetica-Bold");

doc.text(
  `TOTAL TTC : ${Number(invoice.totalTTC).toFixed(2)} €`,
  totalBoxX + 15,
  totalBoxY + 55
);

y = totalBoxY + totalBoxHeight + 25;

 doc.moveTo(50, y -10)
    .lineTo(550, y -10)
    .stroke();


// COORDONNÉES BANCAIRES

doc.fontSize(10)
  .font("Helvetica-Bold");

doc.text(
  "Coordonnées bancaires",
  50,
  y  
);

y += 20;

doc.fontSize(10);

// Ligne 1

doc.font("Helvetica-Bold");
doc.text("Banque :", 50, y);

doc.font("Helvetica");
doc.text(
  company?.companyBank || "",
  95,
  y
);

doc.font("Helvetica-Bold");
doc.text("IBAN :", 300, y);

doc.font("Helvetica");
doc.text(
  company?.companyIban || "",
  340,
  y
);

y += 18;

// Ligne 2

doc.font("Helvetica-Bold");
doc.text("BIC :", 50, y);

doc.font("Helvetica");
doc.text(
  company?.companyBic || "",
  95,
  y
);

doc.font("Helvetica-Bold");
doc.text("Titulaire :", 300, y);

doc.font("Helvetica");
doc.text(
  company?.companyAccountHolder || "",
  355,
  y
);

y += 15;

doc.moveTo(50, y)
   .lineTo(550, y)
   .stroke();

y += 15;

// MENTIONS LÉGALES

doc
  .font("Helvetica-Bold")
  .fontSize(10)
  .text(
    "Mentions légales",
    50,
    y
  );

y += 20;

doc
  .font("Helvetica")
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

y += 30;

// CONDITIONS DE RÈGLEMENT

doc.text(
  `Conditions de règlement : ${company?.deliveryTerms || "30 jours"}`,
  50,
  y
);

y += 20;

// PIED DE PAGE SOCIÉTÉ

doc
  .fontSize(10)
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
);

module.exports = router;
