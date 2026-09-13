const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const auth = require("../middleware/auth");
const Contact = require("../models/contact");
const Product = require("../models/product");
const Invoice = require("../models/invoice");
const StockMovement = require("../models/stockMovement");
const AuditLog = require("../models/auditLog");

process.env.JWT_SECRET = "test-secret-only";

function objectId() {
  return new mongoose.Types.ObjectId();
}

function executeAuth(authorization) {
  return new Promise(resolve => {
    const req = { headers: { authorization } };
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        resolve({ nextCalled: false, statusCode: this.statusCode, body, req });
      }
    };

    auth(req, res, () => resolve({ nextCalled: true, req }));
  });
}

test("auth refuse une requête sans jeton", async () => {
  const result = await executeAuth(undefined);
  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 401);
  assert.equal(result.body.error, "Token manquant");
});

test("auth refuse un jeton malformé", async () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  const result = await executeAuth("Bearer mauvais-jeton");
  console.error = originalConsoleError;
  assert.equal(result.nextCalled, false);
  assert.equal(result.statusCode, 401);
  assert.equal(result.body.error, "Token invalide");
});

test("auth attribue le bon userId à un jeton valide", async () => {
  const userId = objectId().toString();
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const result = await executeAuth(`Bearer ${token}`);
  assert.equal(result.nextCalled, true);
  assert.equal(result.req.userId, userId);
});

test("les données métier exigent un propriétaire", async () => {
  await assert.rejects(new Contact({ firstname: "Alice" }).validate(), /userId/);
  await assert.rejects(new Product({ name: "Service" }).validate(), /userId/);
  await assert.rejects(new Invoice({ type: "invoice" }).validate(), /userId/);
});

test("un produit ne peut pas avoir de TVA ou stock négatif", async () => {
  const userId = objectId();
  await assert.rejects(
    new Product({ userId, name: "Produit", priceHT: 10, tva: 120, stock: -1 }).validate(),
    /tva|stock/
  );
});

test("un mouvement de stock utilise un type contrôlé", async () => {
  await assert.rejects(
    new StockMovement({
      userId: objectId(),
      productId: objectId(),
      quantity: 1,
      type: "ajustement-libre"
    }).validate(),
    /type/
  );
});

test("le statut d'envoi e-mail est contrôlé", async () => {
  await assert.rejects(
    new Invoice({ userId: objectId(), emailStatus: "inconnu" }).validate(),
    /emailStatus/
  );
});

test("un événement métier exige le compte concerné", async () => {
  await assert.rejects(
    new AuditLog({ action: "user.login" }).validate(),
    /userId/
  );
});

test("les numéros de documents sont uniques par compte", () => {
  const hasUniqueIndex = Invoice.schema.indexes().some(([fields, options]) =>
    fields.userId === 1 && fields.invoiceNumber === 1 && options.unique === true
  );
  assert.equal(hasUniqueIndex, true);
});

test("un document conserve l'instantané tarifaire de ses lignes", () => {
  const invoice = new Invoice({
    userId: objectId(),
    products: [{
      productId: objectId(),
      productName: "Prestation",
      quantity: 2,
      unitHT: 100,
      unitTTC: 120,
      tva: 20,
      lineHT: 200,
      lineTTC: 240
    }]
  });

  assert.equal(invoice.products[0].productName, "Prestation");
  assert.equal(invoice.products[0].unitHT, 100);
  assert.equal(invoice.products[0].lineTTC, 240);
});
