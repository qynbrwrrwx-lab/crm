const express = require("express");

const PDFDocument = require("pdfkit");

const Invoice =
  require("../models/invoice");

const Product =
  require("../models/product");

const Contact =
  require("../models/contact");

const auth =
  require("../middleware/auth");

const sendInvoiceEmail =
  require("../services/emailService");

const router = express.Router();

// ================= GET INVOICES =================

router.get("/", auth, async (req, res) => {

  try {

    const invoices =
      await Invoice.find({

        userId: req.userId

      }).sort({

        createdAt: -1
      });

    res.json(invoices);

  } catch (err) {

    console.error(err);

    res.status(500).json({

      error:
        "Erreur récupération factures"
    });
  }
});

// ================= CREATE INVOICE =================

router.post("/", auth, async (req, res) => {

  try {

    const {
      type,
      contactId,
      products,
      paymentMethod
    } = req.body;

    // ================= CONTACT =================

    const contact =
  await Contact.findById(contactId);

        _id: contactId,

        userId: req.userId
      });

    if (!contact) {

      return res.status(404).json({

        error: "Contact introuvable"
      });
    }

    // ================= TOTALS =================

    let totalHT = 0;

    let totalTTC = 0;

    const formattedProducts = [];

    // ================= PRODUCTS =================

    for (const item of products) {

      const product =
  await Product.findById(
    item.productId
  );
  
      if (!product) continue;

      const quantity =
        Number(item.quantity);

      // ================= STOCK =================

      if (
        type === "invoice" &&
        product.stock < quantity
      ) {

        return res.status(400).json({

          error:
            `Stock insuffisant pour ${product.name}`
        });
      }

      const lineHT =
        product.priceHT * quantity;

      const lineTTC =
        product.priceTTC * quantity;

      totalHT += lineHT;

      totalTTC += lineTTC;

      formattedProducts.push({

        productId: product._id,

        name: product.name,

        quantity,

        priceHT: product.priceHT,

        tva: product.tva,

        totalHT:
          Number(lineHT.toFixed(2)),

        totalTTC:
          Number(lineTTC.toFixed(2))
      });

      // ================= UPDATE STOCK =================

      if (type === "invoice") {

        product.stock -= quantity;

        await product.save();
      }
    }

    // ================= CREATE DOCUMENT =================

    const invoice =
      await Invoice.create({

        userId: req.userId,

        type,

        contactId,

        contactName:
          `${contact.firstname || ""}
          ${contact.lastname || ""}
          ${contact.companyName || ""}`,

        invoiceNumber:
          type === "quote"
            ? "DEV-" + Date.now()
            : "FAC-" + Date.now(),

        products: formattedProducts,

        totalHT:
          Number(totalHT.toFixed(2)),

        totalTTC:
          Number(totalTTC.toFixed(2)),

        paymentMethod
      });

    // ================= PDF =================

    const doc =
      new PDFDocument({

        margin: 50
      });

    const buffers = [];

    doc.on(
      "data",
      buffers.push.bind(buffers)
    );

    // ================= PDF CONTENT =================

    doc
      .fontSize(24)
      .fillColor("#2563eb")
      .text(

        type === "quote"
          ? "DEVIS"
          : "FACTURE",

        {
          align: "center"
        }
      );

    doc.moveDown();

    doc
      .fontSize(12)
      .fillColor("black")
      .text("My Prospect");

    doc.text("contact@myprospect.fr");

    doc.moveDown();

    doc.text(
      `Numéro : ${invoice.invoiceNumber}`
    );

    doc.text(
      `Date : ${new Date()
        .toLocaleDateString()}`
    );

    doc.moveDown();

    // ================= CLIENT =================

    doc
      .fontSize(16)
      .fillColor("#2563eb")
      .text("CLIENT");

    doc.moveDown(0.5);

    doc
      .fontSize(12)
      .fillColor("black")
      .text(invoice.contactName);

    doc.text(contact.email || "");

    doc.text(contact.phone || "");

    doc.text(
      contact.billingAddress || ""
    );

    doc.moveDown();

    // ================= PRODUCTS =================

    doc
      .fontSize(16)
      .fillColor("#2563eb")
      .text("PRODUITS");

    doc.moveDown();

    formattedProducts.forEach(product => {

      doc
        .fontSize(12)
        .fillColor("black")
        .text(

          `${product.name} x${product.quantity}`,

          {
            continued: true
          }
        )

        .text(
          `${product.totalTTC.toFixed(2)} €`,
          {
            align: "right"
          }
        );

      doc.moveDown(0.5);
    });

    doc.moveDown();

    // ================= TOTAL =================

    doc
      .fontSize(20)
      .fillColor("#16a34a")
      .text(

        `TOTAL TTC : ${invoice.totalTTC.toFixed(2)} €`,

        {
          align: "right"
        }
      );

    doc.moveDown(2);

    doc
      .fontSize(10)
      .fillColor("gray")
      .text(

        "Merci pour votre confiance 🙌",

        {
          align: "center"
        }
      );

    // ================= END PDF =================

    doc.end();

    // ================= EMAIL =================

    doc.on("end", async () => {

      try {

        const pdfBuffer =
          Buffer.concat(buffers);

        if (contact.email) {

          await sendInvoiceEmail({

            to: contact.email,

            invoice,

            pdfBuffer
          });

          console.log(
            "✅ Email envoyé"
          );
        }

      } catch (emailError) {

        console.error(
          "❌ Erreur email :",
          emailError
        );
      }
    });

    // IMPORTANT :
    // Réponse immédiate
    // même si email plante

    res.json({

      success: true,

      invoice
    });

  } catch (err) {

    console.error(
      "❌ ERREUR FACTURE :",
      err
    );

    res.status(500).json({

      error:
        err.message ||
        "Erreur création facture"
    });
  }
});

// ================= MARK AS PAID =================

router.put("/pay/:id", auth, async (req, res) => {

  try {

    const invoice =
      await Invoice.findOne({

        _id: req.params.id,

        userId: req.userId
      });

    if (!invoice) {

      return res.status(404).json({

        error:
          "Facture introuvable"
      });
    }

    invoice.paymentStatus =
      "paid";

    await invoice.save();

    res.json(invoice);

  } catch (err) {

    console.error(err);

    res.status(500).json({

      error:
        "Erreur paiement"
    });
  }
});

// ================= DELETE =================

router.delete("/:id", auth, async (req, res) => {

  try {

    await Invoice.findOneAndDelete({

      _id: req.params.id,

      userId: req.userId
    });

    res.json({

      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({

      error:
        "Erreur suppression"
    });
  }
});

module.exports = router;