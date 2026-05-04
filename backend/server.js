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

const app = express();

// ================= CONFIG =================

app.set("trust proxy", 1);

app.use(express.json());

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// 🔐 SECRET
const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET manquant !");
}

// ================= RATE LIMIT =================

// ❌ Désactivé global pour éviter blocage
// app.use(limiter);

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
  password: { type: String, required: true }
});

const User = mongoose.model("User", UserSchema);

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

// REGISTER
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
      return res.status(400).json({ error: "Utilisateur existe déjà" });
    }

    const hash = await bcrypt.hash(password, 10);

    await User.create({ email, password: hash });

    res.json({ success: true });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    console.log("LOGIN BODY:", req.body);

    if (!email || !password) {
      return res.status(400).json({ error: "Champs requis" });
    }

    email = email.toLowerCase();

    const user = await User.findOne({ email });

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

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ================= CLIENTS =================

// GET
app.get("/clients", auth, async (req, res) => {
  try {
    const { search, favorite } = req.query;

    let filter = { userId: req.userId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    if (favorite === "true") {
      filter.favorite = true;
    }

    const clients = await Client.find(filter)
      .select("-__v")
      .sort({ createdAt: -1 });

    res.json(clients);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ADD
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

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création client" });
  }
});

// DELETE
app.delete("/clients/:id", auth, async (req, res) => {
  try {
    await Client.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur suppression" });
  }
});

// FAVORITE
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

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur favoris" });
  }
});

// ================= FRONTEND (IMPORTANT À LA FIN) =================

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ================= SERVER =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 CRM CLOUD LEVEL 4 PRO lancé sur port", PORT);
});