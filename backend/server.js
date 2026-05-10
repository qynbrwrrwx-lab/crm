// ================= ENV =================

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// ================= IMPORTS =================

const cors = require("cors");

const express = require("express");

const mongoose = require("mongoose");

const helmet = require("helmet");

const rateLimit =
  require("express-rate-limit");

const path = require("path");

// ================= ROUTES =================

const authRoutes =
  require("./routes/authRoutes");

const contactRoutes =
  require("./routes/contactRoutes");

const productRoutes =
  require("./routes/productRoutes");

const invoiceRoutes =
  require("./routes/invoiceRoutes");

// ================= APP =================

const app = express();

app.use(cors({
  origin: [
    "https://www.my-prospect.com",
    "https://crm-2-15ox.onrender.com"
  ],
  credentials: true
}));

// ================= CONFIG =================

app.set("trust proxy", 1);

app.use(express.json());

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// ================= RATE LIMIT =================

app.use(
  "/api/auth/login",

  rateLimit({

    windowMs:
      10 * 60 * 1000,

    max: 5
  })
);

app.use(
  "/api/auth/register",

  rateLimit({

    windowMs:
      10 * 60 * 1000,

    max: 10
  })
);

// ================= DATABASE =================

mongoose
  .connect(process.env.MONGO_URI)

  .then(() => {

    console.log(
      "✅ MongoDB connecté"
    );
  })

  .catch(err => {

    console.error(
      "❌ MongoDB error:",
      err
    );

    process.exit(1);
  });

// ================= API ROUTES =================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/contacts",
  contactRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/invoices",
  invoiceRoutes
);

// ================= FRONTEND =================

app.use(
  express.static(
    path.join(
      __dirname,
      "../frontend"
    )
  )
);

app.get("*", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "../frontend/index.html"
    )
  );
});

// ================= SERVER =================

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `🚀 Serveur lancé sur port ${PORT}`
  );
});