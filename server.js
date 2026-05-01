const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const app = express();

app.use(express.json());
app.use(express.static("public"));

// ================= MONGODB =================

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté"))
  .catch(err => console.error(err));

// ================= MODELS =================

// USER
const User = mongoose.model("User", {
  email: String,
  password: String
});

// CLIENT
const ClientSchema = new mongoose.Schema({
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

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.json({ error: "Utilisateur introuvable" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.json({ error: "Mot de passe incorrect" });

  res.json({ success: true });
});

// ================= CLIENTS =================

// 🔎 GET AVEC FILTRES (SEARCH + FAVORITES)
app.get("/clients", async (req, res) => {
  const { search, favorite } = req.query;

  let filter = {};

  // 🔎 recherche texte
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } }
    ];
  }

  // ⭐ filtre favoris
  if (favorite === "true") {
    filter.favorite = true;
  }

  const clients = await Client.find(filter).sort({ createdAt: -1 });

  res.json(clients);
});

// ADD CLIENT
app.post("/clients", async (req, res) => {
  const client = await Client.create({
    ...req.body,
    favorite: false
  });

  res.json(client);
});

// DELETE CLIENT
app.delete("/clients/:id", async (req, res) => {
  await Client.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ⭐ TOGGLE FAVORITE
app.put("/clients/favorite/:id", async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) return res.json({ error: "Client introuvable" });

  client.favorite = !client.favorite;
  await client.save();

  res.json(client);
});

// ================= SERVER =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 CRM CLOUD LEVEL 3+ lancé sur port", PORT);
});