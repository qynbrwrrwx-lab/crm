const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const frontend = path.resolve(__dirname, "../../frontend");
const html = fs.readFileSync(path.join(frontend, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script\s+src="([^"]+)"[^>]*>/g)].map(match => match[1]);
const productScripts = scripts.filter(src => src === "/js/products.js" || src.startsWith("/js/products/"));
const plain = value => JSON.parse(JSON.stringify(value));

function browser() {
  const elements = new Map(), listeners = [], calls = [], toasts = [];
  for (const id of [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]).concat("productPurchasePriceHT")) {
    elements.set(id, { value: "", innerHTML: "", textContent: "", style: {}, disabled: false, hidden: false,
      addEventListener() {}, focus() {}, closest: () => null, querySelector: () => null, insertAdjacentHTML() {} });
  }
  let loading = false;
  const context = vm.createContext({
    document: { getElementById: id => elements.get(id) || null, addEventListener: (name, callback) => listeners.push({ name, callback }) },
    console: { error() {} }, showToast: message => toasts.push(message),
    showLoader: () => { loading = true; }, hideLoader: () => { loading = false; },
    apiFetch: async (...args) => { calls.push(args); throw new Error("Unexpected API request"); },
    confirmAppAction: async () => true, loadInvoiceData: async () => {}, renderSuppliers() {}, updateStockKPI() {}
  });
  context.window = context;
  for (const src of ["/js/core/text.js", "/js/core/formatters.js", ...productScripts]) {
    vm.runInContext(fs.readFileSync(path.join(frontend, src), "utf8"), context, { filename: src, timeout: 1000 });
  }
  return { context, elements, listeners, calls, toasts, loading: () => loading, read: expression => vm.runInContext(expression, context) };
}

function product(overrides = {}) {
  return { _id: "product", name: "Article", priceHT: 100, purchasePriceHT: 60, tva: 20, stock: 4, lowStockThreshold: 5, category: "Matériel", ...overrides };
}

test("product modules load once with a single initialization callback", () => {
  assert.equal(productScripts[0], "/js/products.js");
  assert.equal(new Set(productScripts).size, productScripts.length);
  assert.deepEqual(productScripts.slice(1).map(src => path.basename(src)).sort(), fs.readdirSync(path.join(frontend, "js/products")).filter(name => name.endsWith(".js")).sort());
  for (const src of productScripts) assert.ok(scripts.indexOf(src) < scripts.indexOf("/js/app.js"));
  const b = browser();
  assert.equal(b.listeners.length, 1);
  assert.equal(b.listeners[0].name, "DOMContentLoaded");
  b.listeners[0].callback();
  for (const name of ["addProduct", "editProduct", "loadProducts", "openRestockModal", "handleProductsCsvImport", "prepareRestockOrders"]) assert.equal(typeof b.context[name], "function");
  assert.equal(b.calls.length, 0);
});

test("catalog preserves stock states and escapes product text", () => {
  const b = browser();
  b.context.renderProducts([
    product({ name: "<img src=x>", stock: 0 }), product({ _id: "low", stock: 5 }), product({ _id: "healthy", stock: 6 })
  ]);
  const body = b.elements.get("productsList").innerHTML;
  assert.match(body, /product-card-empty/);
  assert.match(body, /product-card-low/);
  assert.match(body, /product-card-healthy/);
  assert.match(body, /&lt;img src=x&gt;/);
  assert.doesNotMatch(body, /<img src=x>/);
});

test("catalog filters and priority sort retain only matching products without mutating shared state", () => {
  const b = browser();
  b.context.fixtures = [product({ _id: "low" }), product({ _id: "empty", stock: 0 }), product({ _id: "other", category: "Autre" }), product({ _id: "healthy", stock: 20 })];
  b.read("allProducts = fixtures");
  b.elements.get("productsFilter").value = "article";
  b.elements.get("productCategoryFilter").value = "Matériel";
  b.elements.get("productStockFilter").value = "low";
  b.elements.get("productSort").value = "restock-priority";
  let rendered;
  b.context.renderProducts = products => { rendered = products; };
  b.context.filterProducts();
  assert.deepEqual(plain(rendered.map(item => item._id)), ["empty", "low"]);
  assert.equal(b.read("allProducts[0]._id"), "low");
  assert.equal(b.read("allProducts.length"), 4);
});

test("editing disables direct stock changes and cancellation resets the form", () => {
  const b = browser();
  b.context.fixtures = [product({ tva: 0, lowStockThreshold: 0 })];
  b.read("allProducts = fixtures");
  b.context.editProduct("product");
  assert.equal(b.read("editingProductId"), "product");
  assert.equal(b.elements.get("productStock").disabled, true);
  assert.equal(Number(b.elements.get("productTVA").value), 0);
  assert.equal(Number(b.elements.get("productLowStockThreshold").value), 0);
  b.context.cancelProductEdit();
  assert.equal(b.read("editingProductId"), null);
  assert.equal(b.elements.get("productStock").disabled, false);
});

test("saving a product edit uses the same PUT payload and refreshes the catalog", async () => {
  const b = browser();
  b.context.fixtures = [product()];
  b.read("allProducts = fixtures");
  b.context.editProduct("product");
  let saved, refreshed = 0;
  b.context.apiFetch = async (url, options) => { saved = { url, method: options.method, data: JSON.parse(options.body) }; };
  b.context.loadProducts = async () => refreshed++;
  await b.context.addProduct();
  assert.equal(saved.url, "/api/products/product");
  assert.equal(saved.method, "PUT");
  assert.equal(Number(saved.data.purchasePriceHT), 60);
  assert.equal(Number(saved.data.stock), 4);
  assert.equal(refreshed, 1);
  assert.equal(b.read("editingProductId"), null);
  assert.equal(b.loading(), false);
});

test("missing product name or price blocks submission", async () => {
  const b = browser();
  await b.context.addProduct();
  assert.equal(b.calls.length, 0);
  assert.match(b.toasts.at(-1), /Nom et prix obligatoires/);
});

test("commercial summary counts paid product lines only and supports both reference formats", async () => {
  const b = browser();
  b.context.apiFetch = async () => [
    { type: "invoice", paymentStatus: "paid", createdAt: "2026-01-01", products: [{ productId: "product", quantity: 2, lineTTC: 240 }, { productId: "other", quantity: 50, lineTTC: 5000 }] },
    { type: "invoice", paymentStatus: "pending", createdAt: "2026-02-01", products: [{ productId: { _id: "product" }, quantity: 3, lineTTC: 360 }] },
    { type: "quote", createdAt: "2026-03-01", products: [{ productId: "unrelated", quantity: 1 }] }
  ];
  const summary = await b.context.getProductCommercialSummary("product");
  assert.equal(summary.quantitySold, 2);
  assert.equal(summary.revenue, 240);
  assert.equal(summary.relatedDocuments.length, 2);
  assert.equal(summary.lastDocument.paymentStatus, "pending");
});

test("commercial summary renders the latest document without shadowing the browser document", () => {
  const b = browser();
  b.context.renderProductCommercialSummary({ quantitySold: 2, revenue: 240, relatedDocuments: [], lastDocument: { type: "invoice", invoiceNumber: "FAC-1", createdAt: "2026-01-01" } });
  assert.equal(b.elements.get("productSoldQuantity").textContent, "2 unités");
  assert.equal(b.elements.get("productLastDocument").textContent, "Facture · FAC-1");
  b.context.renderProductCommercialSummary({ quantitySold: 0, revenue: 0, relatedDocuments: [], lastDocument: null });
  assert.equal(b.elements.get("productLastDocument").textContent, "Aucun document");
});

test("restock rejects non-positive and fractional quantities", async () => {
  const b = browser();
  b.read('restockingProductId = "product"');
  for (const value of ["0", "-1", "1.5"]) {
    b.elements.get("restockQuantity").value = value;
    await b.context.confirmRestock();
  }
  assert.equal(b.calls.length, 0);
  assert.match(b.toasts.at(-1), /quantité entière positive/);
});

test("restock uses PATCH, refreshes products and closes only after success", async () => {
  const b = browser();
  b.read('restockingProductId = "product"');
  b.elements.get("restockQuantity").value = "3";
  let saved, refreshed = 0;
  b.context.apiFetch = async (url, options) => { saved = { url, method: options.method, body: JSON.parse(options.body) }; };
  b.context.loadProducts = async () => refreshed++;
  await b.context.confirmRestock();
  assert.deepEqual(saved, { url: "/api/products/product/stock", method: "PATCH", body: { quantity: 3 } });
  assert.equal(refreshed, 1);
  assert.equal(b.read("restockingProductId"), null);
  assert.equal(b.elements.get("restockModal").style.display, "none");
});

test("failed restock preserves the open product and entered quantity", async () => {
  const b = browser();
  b.read('restockingProductId = "product"');
  b.elements.get("restockQuantity").value = "3";
  b.elements.get("restockModal").style.display = "flex";
  b.context.apiFetch = async () => { throw new Error("Stock unavailable"); };
  await b.context.confirmRestock();
  assert.equal(b.read("restockingProductId"), "product");
  assert.equal(b.elements.get("restockQuantity").value, "3");
  assert.equal(b.elements.get("restockModal").style.display, "flex");
});

test("stock history escapes document references and error messages", async () => {
  const b = browser();
  b.context.apiFetch = async () => [{ quantity: -2, type: "sale", createdAt: "2026-01-01", documentId: { invoiceNumber: "<img src=x>" } }];
  assert.match(await b.context.getStockHistoryMarkup("product"), /&lt;img src=x&gt;/);
  b.context.apiFetch = async () => { throw new Error("<script>failure</script>"); };
  assert.doesNotMatch(await b.context.getStockHistoryMarkup("product"), /<script>/);
});

test("restock suggestion export preserves thresholds, zero thresholds and quantity ordering", () => {
  const b = browser();
  b.context.fixtures = [product(), product({ _id: "zero", stock: 0, lowStockThreshold: 0 }), product({ _id: "healthy", stock: 20 })];
  b.read("allProducts = fixtures");
  let exported;
  b.context.downloadCsvFile = (rows, label) => { exported = { rows, label }; };
  b.context.exportRestockSuggestionsCsv();
  assert.equal(exported.label, "reassort-a-commander");
  assert.equal(exported.rows.length, 3);
  assert.equal(exported.rows[1][6], 1);
  assert.equal(exported.rows[2][6], 6);
  assert.equal(b.read("allProducts[0].stock"), 4);
});

test("cancelled product deletion and CSV import make no request", async () => {
  const b = browser();
  b.context.confirmAppAction = async () => false;
  b.context.readCsvImport = async () => [{ nom: "Article", "prix ht": "12,50" }];
  await b.context.deleteProduct("product");
  await b.context.handleProductsCsvImport({});
  assert.equal(b.calls.length, 0);
});

test("product CSV import normalizes decimal commas and preserves zero VAT", async () => {
  const b = browser();
  b.context.readCsvImport = async () => [{ nom: "Article", "prix ht": "12,50", tva: "0", stock: "2", "seuil stock faible": "0" }];
  let saved;
  b.context.apiFetch = async (url, options) => { assert.equal(url, "/api/products"); saved = JSON.parse(options.body); };
  b.context.loadProducts = async () => {};
  await b.context.handleProductsCsvImport({});
  assert.equal(saved.priceHT, "12.50");
  assert.equal(saved.tva, "0");
  assert.equal(saved.lowStockThreshold, "0");
  assert.equal(b.loading(), false);
});
