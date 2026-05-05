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

// ================= ENV VAR =================
const {
  JWT_SECRET,
  MONGO_URI,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  BASE_URL
} = process.env;

if (!JWT_SECRET || !MONGO_URI || !EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS || !BASE_URL) {
  throw new Error("❌ Variables ENV manquantes !");
}

// ================= SMTP =================
const transporter = nodemailer.createTransport({
  host: "smtp.amen.fr",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test SMTP
transporter.verify((err) => {
  if (err) console.error("❌ SMTP ERROR:", err);
  else console.log("✅ SMTP prêt");
});

// ================= RATE LIMIT =================
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: "Trop de tentatives, réessayez plus tard" }
});

const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: "Trop de comptes créés, réessayez plus tard" }
});

app.use("/login", loginLimiter);
app.use("/register", registerLimiter);

// ================= MONGODB =================
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ================= MODELS =================
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  isVerified: { type: Boolean, default: false },
  verifyToken: String,
  verifyExpires: Date
});

const User = mongoose.model("User", UserSchema);

const ClientSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  phone: String,
  address: String,
  lat: Number,
  lng: Number,
  favorite: { type: Boolean, default: false }
}, { timestamps: true });

const Client = mongoose.model("Client", ClientSchema);

// ================= AUTH =================
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token manquant" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide" });
  }
}

// ================= REGISTER =================
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

    if (existing && !existing.isVerified) {
      await User.deleteOne({ email });
    }

    if (existing && existing.isVerified) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    const hash = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString("hex");

    await User.create({
      email,
      password: hash,
      verifyToken: token,
      verifyExpires: Date.now() + 3600000, // 1h
      isVerified: false
    });

    const verifyLink = `${BASE_URL}/verify/${token}`;

    await transporter.sendMail({
      from: `"My Prospect" <${EMAIL_USER}>`,
      to: email,
      subject: "Confirme ton compte",
      html: `
        <h2>Bienvenue 👋</h2>
        <p>Confirme ton compte :</p>
        <a href="${verifyLink}">Valider mon compte</a>
      `
    });

    res.json({ success: true, message: "Email envoyé 📩" });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ================= VERIFY =================
app.get("/verify/:token", async (req, res) => {
  const user = await User.findOne({
    verifyToken: req.params.token,
    verifyExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.send("Lien invalide ou expiré ❌");
  }

  user.isVerified = true;
  user.verifyToken = null;
  user.verifyExpires = null;

  await user.save();

  res.send("Compte validé ✅");
});

// ================= LOGIN =================
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

    if (!user.isVerified) {
      return res.status(403).json({ error: "Compte non validé" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ error: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
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
  const clients = await Client.find({ userId: req.userId })
    .select("-__v")
    .sort({ createdAt: -1 });

  res.json(clients);
});

app.post("/clients", auth, async (req, res) => {
  const client = await Client.create({
    ...req.body,
    userId: req.userId
  });

  res.json(client);
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
    return res.status(404).json({ error: "Introuvable" });
  }

  client.favorite = !client.favorite;
  await client.save();

  res.json(client);
});

// ================= FRONT =================
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ================= SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 CRM PRO lancé sur port", PORT);
});