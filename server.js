const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());
app.use(express.static("public"));

// 🔐 SECRET JWT (mets une vraie clé en prod)
const SECRET = "supersecretkey123";

// ================= MONGODB =================

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté"))
  .catch(err => console.error(err));

// ================= MODELS =================

// USER
const UserSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model("User", UserSchema);

// CLIENT (lié à user)
const ClientSchema = new mongoose.Schema({
  userId: String, // 🔥 IMPORTANT

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
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ error: "Non autorisé" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
}

// ================= AUTH =================

// REGISTER
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.json({ error: "Utilisateur existe déjà" });

  const hash = await bcrypt.hash(password, 10);

  await User.create({ email, password: hash });

  res.json({ success: true });
});

// LOGIN (avec token)
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ error: "Utilisateur introuvable" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.json({ error: "Mot de passe incorrect" });

  const token = jwt.sign({ id: user._id }, SECRET);

  res.json({ success: true, token });
});

// ================= CLIENTS =================

// 🔎 GET CLIENTS (USER + FILTERS)
app.get("/clients", auth, async (req, res) => {
  const { search, favorite } = req.query;

  let filter = {
    userId: req.userId // 🔥 important
  };

  // 🔎 recherche
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } }
    ];
  }

  // ⭐ favoris
  if (favorite === "true") {
    filter.favorite = true;
  }

  const clients = await Client.find(filter).sort({ createdAt: -1 });

  res.json(clients);
});

// ADD CLIENT (lié à user)
app.post("/clients", auth, async (req, res) => {
  const client = await Client.create({
    ...req.body,
    userId: req.userId,
    favorite: false
  });

  res.json(client);
});

// DELETE sécurisé
app.delete("/clients/:id", auth, async (req, res) => {
  await Client.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId
  });

  res.json({ success: true });
});

// ⭐ TOGGLE FAVORITE sécurisé
app.put("/clients/favorite/:id", auth, async (req, res) => {
  const client = await Client.findOne({
    _id: req.params.id,
    userId: req.userId
  });

  if (!client) return res.json({ error: "Client introuvable" });

  client.favorite = !client.favorite;
  await client.save();

  res.json(client);
});

// ================= SERVER =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 CRM CLOUD LEVEL 4 sécurisé lancé sur port", PORT);
});