require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/user");
const Contact = require("../models/contact");
const Product = require("../models/product");
const Invoice = require("../models/invoice");
const Company = require("../models/companyModel");

async function migrateModel(Model, userId) {
  const result = await Model.updateMany(
    {
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    },
    { $set: { userId } }
  );

  return result.modifiedCount;
}

async function run() {
  const email = process.env.LEGACY_OWNER_EMAIL
    ?.toLowerCase()
    .trim();

  if (!email) {
    throw new Error(
      "Ajoutez LEGACY_OWNER_EMAIL dans backend/.env avant de lancer la migration."
    );
  }

  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Aucun utilisateur ne correspond à LEGACY_OWNER_EMAIL.");
  }

  const results = {
    contacts: await migrateModel(Contact, user._id),
    products: await migrateModel(Product, user._id),
    invoices: await migrateModel(Invoice, user._id),
    companies: await migrateModel(Company, user._id)
  };

  console.log("Migration terminée :", results);
}

run()
  .catch(error => {
    console.error("Migration annulée :", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
