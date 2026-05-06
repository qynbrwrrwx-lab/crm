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
  .then(() => console.log("✅ MongoDB connecté"))
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
  })
);

// CLIENTS
const Client = mongoose.model(
  "Client",
  new mongoose.Schema(
    {
      userId: mongoose.Schema.Types.ObjectId,

      name: String,
      phone: String,
      address: String,

      lat: Number,
      lng: Number,

      favorite: {
        type: Boolean,
        default: false
      },

      // 🚀 PIPELINE CRM
      status: {
        type: String,
        default: "lead"
      }
    },
    { timestamps: true }
  )
);

// ================= AUTH =================
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Token manquant"
    });
  }

  try {
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

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
    let { email, password } = req.body;

    email = email.toLowerCase().trim();

    const existing = await User.findOne({ email });

    // compte déjà validé
    if (existing && existing.isVerified) {
      return res.status(400).json({
        error: "Email déjà utilisé"
      });
    }

    // supprime ancien compte non validé
    if (existing && !existing.isVerified) {
      await User.deleteOne({ email });
    }

    const hash = await bcrypt.hash(password, 10);

    const token = crypto
      .randomBytes(32)
      .toString("hex");

    await User.create({
      email,
      password: hash,

      verifyToken: token,
      verifyExpires: Date.now() + 3600000,

      isVerified: false
    });

    const verifyLink = `${BASE_URL}/verify/${token}`;

    // EMAIL SENDGRID
    await sgMail.send({
      to: email,
      from: EMAIL_FROM,
      subject: "🚀 Active ton compte",
      html: `
        <div style="font-family:Arial; text-align:center; padding:30px;">
          
          <h2>Bienvenue 👋</h2>

          <p>Active ton compte :</p>

          <table align="center">
            <tr>
              <td style="
                background:#3b82f6;
                padding:14px 24px;
                border-radius:8px;
              ">
                <a 
                  href="${verifyLink}"
                  style="
                    color:white;
                    text-decoration:none;
                    font-weight:bold;
                  "
                >
                  Activer mon compte
                </a>
              </td>
            </tr>
          </table>

          <p style="margin-top:20px; font-size:12px;">
            Si le bouton ne fonctionne pas :
          </p>

          <p style="font-size:12px;">
            <a href="${verifyLink}">
              ${verifyLink}
            </a>
          </p>

        </div>
      `
    });

    res.json({
      success: true
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    res.status(500).json({
      error: "Erreur serveur"
    });
  }
});

// ================= RESEND VERIFICATION =================
app.post("/resend-verification", async (req, res) => {
  try {
    let { email } = req.body;

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user || user.isVerified) {
      return res.json({
        success: true
      });
    }

    const token = crypto
      .randomBytes(32)
      .toString("hex");

    user.verifyToken = token;

    user.verifyExpires = Date.now() + 3600000;

    await user.save();

    const verifyLink = `${BASE_URL}/verify/${token}`;

    await sgMail.send({
      to: email,
      from: EMAIL_FROM,
      subject: "📩 Nouveau lien",
      html: `
        <a href="${verifyLink}">
          Valider mon compte
        </a>
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

// ================= REQUEST RESET PASSWORD =================
app.post("/request-reset", async (req, res) => {
  try {
    let { email } = req.body;

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: true
      });
    }

    const token = crypto
      .randomBytes(32)
      .toString("hex");

    user.resetToken = token;

    user.resetExpires = Date.now() + 3600000;

    await user.save();

    const resetLink = `${BASE_URL}/reset-password/${token}`;

    await sgMail.send({
      to: email,
      from: EMAIL_FROM,
      subject: "🔐 Réinitialiser ton mot de passe",
      html: `
        <div style="font-family:Arial; text-align:center; padding:30px;">

          <h2>Reset mot de passe 🔐</h2>

          <table align="center">
            <tr>
              <td style="
                background:#ef4444;
                padding:14px 24px;
                border-radius:8px;
              ">
                <a
                  href="${resetLink}"
                  style="
                    color:white;
                    text-decoration:none;
                    font-weight:bold;
                  "
                >
                  Réinitialiser
                </a>
              </td>
            </tr>
          </table>

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

// ================= RESET PASSWORD =================
app.post("/reset-password/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetExpires: {
        $gt: Date.now()
      }
    });

    if (!user) {
      return res.status(400).json({
        error: "Lien invalide"
      });
    }

    const hash = await bcrypt.hash(
      req.body.password,
      10
    );

    user.password = hash;

    user.resetToken = null;
    user.resetExpires = null;

    await user.save();

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

// ================= PAGE RESET =================
app.get("/reset-password/:token", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend/reset.html")
  );
});

// ================= VERIFY =================
app.get("/verify/:token", async (req, res) => {

  const user = await User.findOne({
    verifyToken: req.params.token,
    verifyExpires: {
      $gt: Date.now()
    }
  });

  if (!user) {
    return res.redirect(`${BASE_URL}/error.html`);
  }

  user.isVerified = true;

  user.verifyToken = null;
  user.verifyExpires = null;

  await user.save();

  res.redirect(`${BASE_URL}/success.html`);
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user || !user.isVerified) {
      return res.status(400).json({
        error: "Compte invalide"
      });
    }

    const valid = await bcrypt.compare(
      password,
      user.password
    );

    if (!valid) {
      return res.status(400).json({
        error: "Mot de passe incorrect"
      });
    }

    const token = jwt.sign(
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

// ================= CLIENTS =================

// GET CLIENTS
app.get("/clients", auth, async (req, res) => {

  const clients = await Client.find({
    userId: req.userId
  }).sort({
    createdAt: -1
  });

  res.json(clients);
});

// ADD CLIENT
app.post("/clients", auth, async (req, res) => {

  const client = await Client.create({
    ...req.body,
    userId: req.userId
  });

  res.json(client);
});

// DELETE CLIENT
app.delete("/clients/:id", auth, async (req, res) => {

  await Client.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId
  });

  res.json({
    success: true
  });
});

// FAVORITE CLIENT
app.put("/clients/favorite/:id", auth, async (req, res) => {

  const client = await Client.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!client) {
    return res.status(404).json({
      error: "Introuvable"
    });
  }

  client.favorite = !client.favorite;

  await client.save();

  res.json(client);
});

// ================= PIPELINE STATUS =================
app.put("/clients/status/:id", auth, async (req, res) => {

  const client = await Client.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!client) {
    return res.status(404).json({
      error: "Client introuvable"
    });
  }

  client.status = req.body.status;

  await client.save();

  res.json(client);
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
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Serveur lancé sur port", PORT);
});