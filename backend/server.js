// ================= ENV =================

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI manquant");
  process.exit(1);
}

// ================= IMPORTS =================

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();

// ================= CONFIG =================

app.set("trust proxy", 1);
app.use(express.json());

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// ================= EMAIL CONFIG (AMEN) =================

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // smtp.amen.fr
  port: process.env.EMAIL_PORT, // 587
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 🔥 TEST SMTP (tu peux garder pour debug)
transporter.verify((err) => {
  if (err) console.log("❌ SMTP ERROR:", err);
  else console.log("✅ SMTP prêt");
});

// ================= SECRET =================

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET manquant !");
}

// ================= RATE LIMIT =================

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: "Trop de tentatives, réessayez plus tard" }
});

app.use("/login", loginLimiter);

// ================= MONGODB =================

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ================= MODELS =================

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verifyToken: String
});

const User = mongoose.model("User", UserSchema);

const ClientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: String,
  phone: String,
  address: String,
  lat: Number,
  lng: Number,
  favorite: { type: Boolean, default: false }
}, { timestamps: true });

const Client = mongoose.model("Client", ClientSchema);

// ================= AUTH MIDDLEWARE =================

function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token manquant" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide" });
  }
}

// ================= AUTH =================

// REGISTER + EMAIL CONFIRMATION
app.post("/register", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Champs requis" });
    }

    email = email.toLowerCase();

    if (!email.includes("@")) {
      return res.status(400).json({ error: "Email invalide" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Mot de passe trop court" });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    const hash = await bcrypt.hash(password, 10);

    const verifyToken = jwt.sign({ email }, SECRET, { expiresIn: "1d" });

    await User.create({
      email,
      password: hash,
      verifyToken,
      isVerified: false
    });

    // 🔗 lien validation
    const link = `https://my-prospect.com/verify?token=${verifyToken}`;

    await transporter.sendMail({
      from: `"My Prospect" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Confirme ton compte",
      html: `
        <h2>Bienvenue 👋</h2>
        <p>Clique ici pour activer ton compte :</p>
        <a href="${link}">${link}</a>
      `
    });

    res.json({ success: true, message: "Email envoyé 📩" });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// VERIFY EMAIL
app.get("/verify", async (req, res) => {
  try {
    const { token } = req.query;

    const decoded = jwt.verify(token, SECRET);

    const user = await User.findOne({ email: decoded.email });

    if (!user) return res.send("Utilisateur introuvable");

    user.isVerified = true;
    user.verifyToken = null;

    await user.save();

    res.send("✅ Compte activé ! Tu peux te connecter.");

  } catch {
    res.send("❌ Lien invalide ou expiré");
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Champs requis" });
    }

    email = email.toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "Utilisateur introuvable" });
    }

    // 🔥 BLOQUE SI PAS VALIDÉ
    if (!user.isVerified) {
      return res.status(403).json({ error: "Email non vérifié" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ error: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: user._id },
      SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, token });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ================= CLIENTS =================

app.get("/clients", auth, async (req, res) => {
  try {
    const clients = await Client.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(clients);

  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/clients", auth, async (req, res) => {
  try {
    const client = await Client.create({
      ...req.body,
      userId: req.userId
    });

    res.json(client);

  } catch {
    res.status(500).json({ error: "Erreur création client" });
  }
});

app.delete("/clients/:id", auth, async (req, res) => {
  await Client.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId
  });

  res.json({ success: true });
});

app.put("/clients/favorite/:id", auth, async (req, res) => {
  const client = await Client.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!client) {
    return res.status(404).json({ error: "Client introuvable" });
  }

  client.favorite = !client.favorite;
  await client.save();

  res.json(client);
});

// ================= FRONTEND =================

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ================= SERVER =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 CRM lancé sur port", PORT);
});