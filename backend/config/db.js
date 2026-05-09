const mongoose = require("mongoose");

async function connectDB() {

  try {

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log("✅ MongoDB connecté");

  } catch (err) {

    console.error(err);

    process.exit(1);
  }
}

module.exports = connectDB;