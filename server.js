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

const User = mongoose.model("User", {
  email: String,
  password: String
});

const Client = mongoose.model("Client", {
  name: String,
  phone: String,
  address: String,
  lat: Number,
  lng: Number
});

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

// GET
app.get("/clients", async (req, res) => {
  const clients = await Client.find();
  res.json(clients);
});

// ADD
app.post("/clients", async (req, res) => {
  const client = await Client.create(req.body);
  res.json(client);
});

// DELETE
app.delete("/clients/:id", async (req, res) => {
  await Client.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ================= SERVER =================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 CRM CLOUD lancé sur port", PORT);
});