// ================= ENV =================

// 🔥 Charger .env uniquement en local
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

const app = express();

// ================= CONFIG =================

app.set("trust proxy", 1); // 🔥 important sur Render

app.use(express.json());

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
const path = require("path");
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET manquant !");
}

// ================= RATE LIMIT =================

// Global limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);

// 🔥 Protection brute force login
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

// USER
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

const User = mongoose.model("User", UserSchema);

// CLIENT (multi-user sécurisé)
const ClientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  name: String,
  phone: String,
  address: String,
  lat: Number,
  lng: Number,
  favorite: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Client = mongoose.model("Client", ClientSchema);

// ================= MIDDLEWARE AUTH =================

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

// REGISTER
app.post("/register", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Champs requis" });
    }

    email = email.toLowerCase();

    // 🔥 validation email simple
    if (!email.includes("@")) {
      return res.status(400).json({ error: "Email invalide" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Mot de passe trop court" });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).json({ error: "Utilisateur existe déjà" });
    }

    const hash = await bcrypt.hash(password, 10);

    await User.create({ email, password: hash });

    res.json({ success: true });

  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Champs requis" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({ error: "Utilisateur introuvable" });
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

  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ================= CLIENTS =================

// GET CLIENTS
app.get("/clients", auth, async (req, res) => {
  try {
    const { search, favorite } = req.query;

    let filter = {
      userId: req.userId
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    if (favorite === "true") {
      filter.favorite = true;
    }

    const clients = await Client
      .find(filter)
      .select("-__v") // 🔥 protection données
      .sort({ createdAt: -1 });

    res.json(clients);

  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ADD CLIENT
app.post("/clients", auth, async (req, res) => {
  try {
    const { name, phone, address, lat, lng } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Champs requis" });
    }

    const client = await Client.create({
      name,
      phone,
      address,
      lat,
      lng,
      userId: req.userId,
      favorite: false
    });

    res.json(client);

  } catch {
    res.status(500).json({ error: "Erreur création client" });
  }
});

// DELETE CLIENT
app.delete("/clients/:id", auth, async (req, res) => {
  try {
    await Client.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    res.json({ success: true });

  } catch {
    res.status(500).json({ error: "Erreur suppression" });
  }
});

// TOGGLE FAVORITE
app.put("/clients/favorite/:id", auth, async (req, res) => {
  try {
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

  } catch {
    res.status(500).json({ error: "Erreur favoris" });
  }
});

// ================= SERVER =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 CRM CLOUD LEVEL 4 PRO lancé sur port", PORT);
});