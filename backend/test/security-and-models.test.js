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

const { app } = require("../server");

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

test("commercial conversions are unique per source document", () => {
  const indexes = Invoice.schema.indexes();
  const hasUniqueQuoteConversion = indexes.some(([fields, options]) =>
    fields.userId === 1 && fields.sourceQuoteId === 1 && options.unique === true
  );
  const hasUniqueOrderConversion = indexes.some(([fields, options]) =>
    fields.userId === 1 && fields.sourceOrderId === 1 && options.unique === true
  );
  const hasUniqueCreditNote = indexes.some(([fields, options]) =>
    fields.userId === 1 && fields.sourceDocumentId === 1 && options.unique === true
  );

  assert.equal(hasUniqueQuoteConversion, true);
  assert.equal(hasUniqueOrderConversion, true);
  assert.equal(hasUniqueCreditNote, true);
});

test("payment history rejects a negative amount", async () => {
  await assert.rejects(
    new Invoice({
      userId: objectId(),
      payments: [{ amount: -1, method: "Virement bancaire", paidAt: new Date() }]
    }).validate(),
    /payments.0.amount/
  );
});

test("health endpoint reports the current database state", () => {
  const router = app._router || app.router;
  const layer = router.stack.find(item => item.route?.path === "/api/health");
  assert.ok(layer, "health route must exist");

  let statusCode;
  let body;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      body = value;
    }
  };

  layer.route.stack[0].handle({}, response);

  const connected = mongoose.connection.readyState === 1;
  assert.equal(statusCode, connected ? 200 : 503);
  assert.equal(body.database, connected ? "connected" : "disconnected");
});

test("document numbering reads the highest existing sequence", () => {
  const { getHighestSequence } = require("../services/documentNumberService");
  assert.equal(getHighestSequence("DEV-2026-00042"), 42);
  assert.equal(getHighestSequence("DEV-2026-invalid"), 0);
  assert.equal(getHighestSequence(), 0);
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

test("le type de document est contrôlé", async () => {
  await assert.rejects(
    new Invoice({ userId: objectId(), type: "type-invalide" }).validate(),
    /type/
  );
});
