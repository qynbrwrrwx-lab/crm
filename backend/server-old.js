// ================= ENV =================
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// ================= IMPORTS =================
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const path = require("path");
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");

const app = express();

// ================= CONFIG =================
app.set("trust proxy", 1);

app.use(express.json());

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// ================= ENV VAR =================
const {
  JWT_SECRET,
  MONGO_URI,
  SENDGRID_API_KEY,
  EMAIL_FROM,
  BASE_URL
} = process.env;

if (
  !JWT_SECRET ||
  !MONGO_URI ||
  !SENDGRID_API_KEY ||
  !EMAIL_FROM ||
  !BASE_URL
) {
  console.error("❌ Variables ENV manquantes !");
  process.exit(1);
}

// ================= SENDGRID =================
sgMail.setApiKey(SENDGRID_API_KEY);

console.log("✅ SendGrid prêt");

// ================= RATE LIMIT =================
app.use(
  "/login",
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5
  })
);

app.use(
  "/register",
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10
  })
);

// ================= MONGODB =================
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connecté");
  })
  .catch(err => {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  });

// ================= MODELS =================

// USERS
const User = mongoose.model(
  "User",

  new mongoose.Schema({

    email: {
      type: String,
      unique: true
    },

    password: String,

    isVerified: {
      type: Boolean,
      default: false
    },

    verifyToken: String,
    verifyExpires: Date,

    resetToken: String,
    resetExpires: Date

  }, {
    timestamps: true
  })
);

// CONTACTS
const Contact = mongoose.model(
  "Contact",

  new mongoose.Schema({

    userId: mongoose.Schema.Types.ObjectId,

    type: {
      type: String,
      enum: ["particulier", "pro", "association"],
      default: "particulier"
    },

    firstname: String,
    lastname: String,

    companyName: String,
    siret: String,

    email: String,
    phone: String,

    billingAddress: String,
    shippingAddress: String,

    notes: String,

    lat: Number,
    lng: Number,

    favorite: {
      type: Boolean,
      default: false
    }

  }, {
    timestamps: true
  })
);

// PRODUCTS
const Product = mongoose.model(
  "Product",

  new mongoose.Schema({

    userId: mongoose.Schema.Types.ObjectId,

    name: String,

    reference: String,

    description: String,

    category: String,

    barcode: String,

    supplier: String,

    priceHT: Number,

    tva: {
      type: Number,
      default: 20
    },

    priceTTC: Number,

    stock: {
      type: Number,
      default: 0
    },

    active: {
      type: Boolean,
      default: true
    }

  }, {
    timestamps: true
  })
);

// INVOICES
const Invoice = mongoose.model(
  "Invoice",

  new mongoose.Schema({

    userId: mongoose.Schema.Types.ObjectId,

    type: {
      type: String,
      enum: ["quote", "invoice"],
      default: "invoice"
    },

    invoiceNumber: String,

    contactId: mongoose.Schema.Types.ObjectId,

    contactName: String,

    products: [

      {
        productId:
          mongoose.Schema.Types.ObjectId,

        name: String,

        quantity: Number,

        priceHT: Number,

        tva: Number,

        totalHT: Number,

        totalTTC: Number
      }
    ],

    totalHT: Number,

    totalTTC: Number,

    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    },

    paymentMethod: {
      type: String,
      enum: ["cb", "cash", "transfer", "check"],
      default: "transfer"
    }

  }, {
    timestamps: true
  })
);

// ================= AUTH =================
function auth(req, res, next) {

  const authHeader =
    req.headers.authorization;

  if (!authHeader) {

    return res.status(401).json({
      error: "Token manquant"
    });
  }

  try {

    const token =
      authHeader.split(" ")[1];

    const decoded =
      jwt.verify(token, JWT_SECRET);

    req.userId = decoded.id;

    next();

  } catch {

    return res.status(401).json({
      error: "Token invalide"
    });
  }
}

// ================= REGISTER =================
app.post("/register", async (req, res) => {

  try {

    let { email, password } =
      req.body;

    email =
      email.toLowerCase().trim();

    const existing =
      await User.findOne({ email });

    if (existing && existing.isVerified) {

      return res.status(400).json({
        error: "Email déjà utilisé"
      });
    }

    if (existing && !existing.isVerified) {

      await User.deleteOne({ email });
    }

    const hash =
      await bcrypt.hash(password, 10);

    const token =
      crypto.randomBytes(32)
      .toString("hex");

    await User.create({

      email,

      password: hash,

      verifyToken: token,

      verifyExpires:
        Date.now() + 3600000,

      isVerified: false
    });

    const verifyLink =
      `${BASE_URL}/verify/${token}`;

    await sgMail.send({

      to: email,

      from: EMAIL_FROM,

      subject: "🚀 Active ton compte",

      html: `
        <div style="font-family:Arial;text-align:center;padding:30px;">

          <h2>Bienvenue 👋</h2>

          <p>Active ton compte :</p>

          <a
            href="${verifyLink}"
            style="
              background:#3b82f6;
              color:white;
              padding:14px 24px;
              border-radius:8px;
              text-decoration:none;
              font-weight:bold;
              display:inline-block;
            "
          >
            Activer mon compte
          </a>

        </div>
      `
    });

    res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur serveur"
    });
  }
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {

  try {

    let { email, password } =
      req.body;

    email =
      email.toLowerCase().trim();

    const user =
      await User.findOne({ email });

    if (!user || !user.isVerified) {

      return res.status(400).json({
        error: "Compte invalide"
      });
    }

    const valid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!valid) {

      return res.status(400).json({
        error: "Mot de passe incorrect"
      });
    }

    const token =
      jwt.sign(
        {
          id: user._id
        },
        JWT_SECRET,
        {
          expiresIn: "7d"
        }
      );

    res.json({
      success: true,
      token
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur serveur"
    });
  }
});

// ================= CONTACTS =================

// GET CONTACTS
app.get("/contacts", auth, async (req, res) => {

  const contacts =
    await Contact.find({
      userId: req.userId
    }).sort({
      createdAt: -1
    });

  res.json(contacts);
});

// ADD CONTACT
app.post("/contacts", auth, async (req, res) => {

  const contact =
    await Contact.create({

      ...req.body,

      userId: req.userId
    });

  res.json(contact);
});

// UPDATE CONTACT
app.put("/contacts/:id", auth, async (req, res) => {

  const contact =
    await Contact.findOne({

      _id: req.params.id,

      userId: req.userId
    });

  if (!contact) {

    return res.status(404).json({
      error: "Contact introuvable"
    });
  }

  Object.assign(contact, req.body);

  await contact.save();

  res.json(contact);
});

// DELETE CONTACT
app.delete("/contacts/:id", auth, async (req, res) => {

  await Contact.findOneAndDelete({

    _id: req.params.id,

    userId: req.userId
  });

  res.json({
    success: true
  });
});

// FAVORITE CONTACT
app.put("/contacts/favorite/:id", auth, async (req, res) => {

  const contact =
    await Contact.findOne({

      _id: req.params.id,

      userId: req.userId
    });

  if (!contact) {

    return res.status(404).json({
      error: "Contact introuvable"
    });
  }

  contact.favorite =
    !contact.favorite;

  await contact.save();

  res.json(contact);
});

// ================= PRODUCTS =================

// GET PRODUCTS
app.get("/products", auth, async (req, res) => {

  const products =
    await Product.find({
      userId: req.userId
    }).sort({
      createdAt: -1
    });

  res.json(products);
});

// ADD PRODUCT
app.post("/products", auth, async (req, res) => {

  const {
    name,
    reference,
    description,
    category,
    barcode,
    supplier,
    priceHT,
    tva,
    stock
  } = req.body;

  const priceTTC =
    Number(priceHT) *
    (1 + Number(tva) / 100);

  const product =
    await Product.create({

      userId: req.userId,

      name,

      reference,

      description,

      category,

      barcode,

      supplier,

      priceHT,

      tva,

      priceTTC:
        Number(priceTTC.toFixed(2)),

      stock
    });

  res.json(product);
});

// UPDATE PRODUCT
app.put("/products/:id", auth, async (req, res) => {

  const product =
    await Product.findOne({

      _id: req.params.id,

      userId: req.userId
    });

  if (!product) {

    return res.status(404).json({
      error: "Produit introuvable"
    });
  }

  Object.assign(product, req.body);

  product.priceTTC =
    Number(product.priceHT) *
    (1 + Number(product.tva) / 100);

  await product.save();

  res.json(product);
});

// DELETE PRODUCT
app.delete("/products/:id", auth, async (req, res) => {

  await Product.findOneAndDelete({

    _id: req.params.id,

    userId: req.userId
  });

  res.json({
    success: true
  });
});

// ================= INVOICES =================

// GET INVOICES
app.get("/invoices", auth, async (req, res) => {

  const invoices =
    await Invoice.find({
      userId: req.userId
    }).sort({
      createdAt: -1
    });

  res.json(invoices);
});

// CREATE INVOICE / QUOTE
app.post("/invoices", auth, async (req, res) => {

  try {

    const {
      type,
      contactId,
      products,
      paymentMethod
    } = req.body;

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

    const formattedProducts = [];

    for (const item of products) {

      const product =
        await Product.findOne({

          _id: item.productId,

          userId: req.userId
        });

      if (!product) {
        continue;
      }

      if (
        type === "invoice" &&
        product.stock < item.quantity
      ) {

        return res.status(400).json({
          error:
            `Stock insuffisant pour ${product.name}`
        });
      }

      const lineHT =
        product.priceHT * item.quantity;

      const lineTTC =
        product.priceTTC * item.quantity;

      totalHT += lineHT;
      totalTTC += lineTTC;

      formattedProducts.push({

        productId: product._id,

        name: product.name,

        quantity: item.quantity,

        priceHT: product.priceHT,

        tva: product.tva,

        totalHT: Number(lineHT.toFixed(2)),

        totalTTC: Number(lineTTC.toFixed(2))
      });

      // DECREMENT STOCK UNIQUEMENT FACTURE
      if (type === "invoice") {

        product.stock -= item.quantity;

        await product.save();
      }
    }

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

    res.json(invoice);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Erreur création facture"
    });
  }
});

// UPDATE PAYMENT STATUS
app.put("/invoices/pay/:id", auth, async (req, res) => {

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

  invoice.paymentStatus =
    req.body.paymentStatus;

  await invoice.save();

  res.json(invoice);
});

// DELETE INVOICE
app.delete("/invoices/:id", auth, async (req, res) => {

  await Invoice.findOneAndDelete({

    _id: req.params.id,

    userId: req.userId
  });

  res.json({
    success: true
  });
});

// ================= FRONT =================
app.use(
  express.static(
    path.join(__dirname, "../frontend")
  )
);

app.get("*", (req, res) => {

  res.sendFile(
    path.join(__dirname, "../frontend/index.html")
  );
});

// ================= SERVER =================
const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    "🚀 Serveur lancé sur port",
    PORT
  );
});