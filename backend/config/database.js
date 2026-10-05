const mongoose = require("mongoose");

async function connectDatabase(uri = process.env.MONGO_URI) {
  if (!uri) throw new Error("MONGO_URI manquant");

  await mongoose.connect(uri);
}

module.exports = { connectDatabase };
