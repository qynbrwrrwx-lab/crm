const test = require("node:test");
const assert = require("node:assert/strict");
const Invoice = require("../models/invoice");
const Product = require("../models/product");
const Company = require("../models/companyModel");
const StockMovement = require("../models/stockMovement");
const DocumentCounter = require("../models/documentCounter");
const AuditLog = require("../models/auditLog");
const routes = require("../routes/invoiceRoutes");
const { getQuoteConversionError, buildOrderData } = require("../controllers/quote-conversion/convert");

function handler(path, method = "post") {
  const route = routes.stack.find(layer => layer.route?.path === path && layer.route.methods[method]);
  assert.ok(route, `${method} ${path} must remain registered`);
  assert.equal(route.route.stack[0].handle, require("../middleware/auth"));
  return route.route.stack.at(-1).handle;
}

function setup(t, document) {
  const created = [];
  const movements = [];
  const audit = [];
  t.mock.method(Invoice, "findOne", async query => {
    assert.equal(query.userId, "owner");
    return document;
  });
  t.mock.method(Invoice, "create", async data => {
    created.push(data);
    return { ...data, _id: "created", deleteOne: async () => {} };
  });
  t.mock.method(Product, "findOne", async query => {
    assert.equal(query.userId, "owner");
    return { name: "Article", stock: 10 };
  });
  t.mock.method(Product, "findOneAndUpdate", async query => {
    assert.equal(query.userId, "owner");
    return { stock: 8 };
  });
  t.mock.method(StockMovement, "create", async data => movements.push(data));
  t.mock.method(DocumentCounter, "findOne", async () => ({ value: 1 }));
  t.mock.method(DocumentCounter, "findOneAndUpdate", async () => ({ value: 2 }));
  t.mock.method(AuditLog, "create", async data => audit.push(data));
  t.mock.method(Company, "findOne", async query => {
    assert.equal(query.userId, "owner");
    return null;
  });
  t.mock.method(Invoice, "find", async query => {
    assert.equal(query.userId, "owner");
    return [];
  });
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  return { created, movements, audit, response, request: { userId: "owner", params: { id: "source" }, body: {} } };
}

function source(type = "quote") {
  return {
    _id: "source", invoiceNumber: "DEV-1", type, status: "accepted", contactId: "contact",
    totalHT: 200, totalTTC: 240, paymentDueDays: 15, paymentTerms: "Virement",
    products: [{ productId: "product", productName: "Article", quantity: 2, unitHT: 100, unitTTC: 120, tva: 20, lineHT: 200, lineTTC: 240 }],
    async save() {}
  };
}

test("quote conversion helpers preserve eligibility and the order data contract", () => {
  assert.deepEqual(getQuoteConversionError(null), { status: 404, error: "Devis introuvable" });
  assert.match(getQuoteConversionError({ type: "quote", status: "draft" }).error, /doit être accepté/);
  const quote = source();
  const order = buildOrderData(quote, "owner", "CMD-1");
  assert.equal(order.invoiceNumber, "CMD-1");
  assert.equal(order.sourceQuoteId, "source");
  assert.equal(order.products[0].unitHT, 100);
  assert.equal(order.paymentDueDays, 15);
  assert.equal(getQuoteConversionError(quote), null);
});

for (const path of ["/convert-to-order/:id", "/convert-to-invoice/:id"]) {
  test(`${path} refuses a document unavailable to the current account`, async t => {
    const state = setup(t, null);
    await handler(path)(state.request, state.response);
    assert.equal(state.response.statusCode, 404);
    assert.equal(state.created.length, 0);
  });
}

for (const change of [{ status: "draft" }, { convertedToOrderId: "existing" }, { type: "invoice" }]) {
  test(`quote conversion rejects ${JSON.stringify(change)}`, async t => {
    const state = setup(t, Object.assign(source(), change));
    await handler("/convert-to-order/:id")(state.request, state.response);
    assert.equal(state.response.statusCode, 400);
    assert.equal(state.created.length, 0);
    assert.equal(state.movements.length, 0);
  });
}

test("quote conversion preserves prices, stock conditions, source link and audit", async t => {
  const quote = source();
  const state = setup(t, quote);
  const updates = [];
  t.mock.method(Product, "findOneAndUpdate", async (...args) => { updates.push(args); return { stock: 8 }; });
  await handler("/convert-to-order/:id")(state.request, state.response);
  assert.equal(state.response.statusCode, 200);
  assert.equal(state.created[0].sourceQuoteId, quote._id);
  assert.equal(state.created[0].totalTTC, 240);
  assert.equal(state.created[0].products[0].unitHT, 100);
  assert.deepEqual(updates[0], [{ _id: "product", userId: "owner", stock: { $gte: 2 } }, { $inc: { stock: -2 } }, { new: true }]);
  assert.equal(state.movements[0].quantity, -2);
  assert.equal(state.movements[0].userId, "owner");
  assert.equal(quote.convertedToOrderId, "created");
  assert.equal(state.audit[0].action, "document.converted_to_order");
});

test("insufficient initial stock creates no order", async t => {
  const state = setup(t, source());
  t.mock.method(Product, "findOne", async () => ({ name: "Article", stock: 1 }));
  await handler("/convert-to-order/:id")(state.request, state.response);
  assert.equal(state.response.statusCode, 400);
  assert.equal(state.created.length, 0);
});

test("stock lost during conversion restores earlier deductions and removes the order", async t => {
  const quote = source();
  quote.products.push({ ...quote.products[0], productId: "second" });
  const state = setup(t, quote);
  const restored = [];
  let deductions = 0;
  let deletedOrder = false;
  let deletedMovements;
  t.mock.method(Invoice, "create", async () => ({ _id: "created", deleteOne: async () => { deletedOrder = true; } }));
  t.mock.method(Product, "findOneAndUpdate", async () => ++deductions === 1 ? { stock: 8 } : null);
  t.mock.method(Product, "updateOne", async (...args) => restored.push(args));
  t.mock.method(StockMovement, "deleteMany", async query => { deletedMovements = query; });
  await handler("/convert-to-order/:id")(state.request, state.response);
  assert.equal(state.response.statusCode, 409);
  assert.deepEqual(restored, [[{ _id: "product", userId: "owner" }, { $inc: { stock: 2 } }]]);
  assert.deepEqual(deletedMovements, { documentId: "created" });
  assert.equal(deletedOrder, true);
  assert.equal(quote.convertedToOrderId, undefined);
  assert.equal(state.audit.length, 0);
});

test("invoice conversion deducts only paid deposits and preserves the source link", async t => {
  const order = Object.assign(source("order"), { sourceQuoteId: "quote" });
  const state = setup(t, order);
  t.mock.method(Invoice, "findOne", async query => {
    assert.equal(query.userId, "owner");
    return query.sourceOrderId ? null : order;
  });
  t.mock.method(Invoice, "find", async query => {
    assert.deepEqual(query, { userId: "owner", isDepositInvoice: true, depositForQuoteId: "quote" });
    return [
      { invoiceNumber: "AC-1", totalHT: 100, totalTTC: 120, payments: [{ amount: 30 }, { amount: 30 }] },
      { invoiceNumber: "AC-2", totalHT: 50, totalTTC: 60, payments: [] }
    ];
  });
  await handler("/convert-to-invoice/:id")(state.request, state.response);
  assert.equal(state.response.statusCode, 200);
  const invoice = state.created[0];
  assert.equal(invoice.totalHT, 150);
  assert.equal(invoice.totalTTC, 180);
  assert.equal(invoice.products.at(-1).lineTTC, -60);
  assert.equal(invoice.paymentStatus, "pending");
  assert.equal(invoice.sourceOrderId, order._id);
  assert.equal(invoice.paymentDueDays, 15);
  assert.equal(order.convertedToInvoiceId, "created");
  assert.equal(state.movements.length, 0);
  assert.equal(state.audit[0].action, "document.converted_to_invoice");
});

test("existing invoice repairs the order link without creating a duplicate", async t => {
  const order = source("order");
  const state = setup(t, order);
  t.mock.method(Invoice, "findOne", async query => query.sourceOrderId ? { _id: "existing" } : order);
  await handler("/convert-to-invoice/:id")(state.request, state.response);
  assert.equal(state.response.statusCode, 400);
  assert.equal(order.convertedToInvoiceId, "existing");
  assert.equal(state.created.length, 0);
});

test("a concurrent duplicate order is reported as a conflict", async t => {
  const state = setup(t, source());
  t.mock.method(console, "error", () => {});
  t.mock.method(Invoice, "create", async () => { throw Object.assign(new Error("duplicate"), { code: 11000 }); });
  await handler("/convert-to-order/:id")(state.request, state.response);
  assert.equal(state.response.statusCode, 409);
  assert.equal(state.movements.length, 0);
});

test("the extracted update route still refuses changes to accepted quotes", async t => {
  const state = setup(t, source());
  await handler("/:id", "put")(state.request, state.response);
  assert.equal(state.response.statusCode, 409);
});
