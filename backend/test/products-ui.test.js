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
    vm.runInContext(fs.readFileSync(path.join(frontend, src), "utf8"), context, { filename: src, timeout: 5000 });
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

test("product card presentation centralizes prices, stock state and supplier data", () => {
  const b = browser(); const item = product({ supplierName: "Acme", supplierReference: "REF", description: "Description" });
  assert.deepEqual(plain(b.context.getProductCardPresentation(item)), { id: "product", stockState: "low", stockLabel: "Stock faible", category: "Matériel", reference: "Sans référence", name: "Article", description: "Description", supplierName: "Acme", supplierReference: "REF", priceHTLabel: b.context.formatProductCurrency(100), tvaLabel: "20 %", priceTTCLabel: b.context.formatProductCurrency(120), marginHTLabel: b.context.formatProductCurrency(40), stock: 4, threshold: 5, stockMeterWidth: 35 });
  assert.equal(b.context.getProductCardPresentation(product({ stock: 6 })).stockMeterWidth, 100);
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

test("commercial summary calculation sorts related documents without changing its source", () => {
  const b = browser();
  const invoices = [
    { _id: "older", type: "invoice", paymentStatus: "paid", createdAt: "2026-01-01", products: [{ productId: "product", quantity: 2, lineTTC: 120 }] },
    { _id: "latest", type: "order", createdAt: "2026-02-01", products: [{ productId: { _id: "product" }, quantity: 3 }] },
    { _id: "other", type: "invoice", paymentStatus: "paid", createdAt: "2026-03-01", products: [{ productId: "other", quantity: 99, lineTTC: 999 }] }
  ];
  const summary = b.context.getProductCommercialSummaryFromInvoices(invoices, "product");
  assert.deepEqual(plain(summary.relatedDocuments.map(item => item._id)), ["latest", "older"]);
  assert.equal(summary.quantitySold, 2);
  assert.equal(summary.revenue, 120);
  assert.equal(invoices[0]._id, "older");
});

test("commercial summary renders the latest document without shadowing the browser document", () => {
  const b = browser();
  b.context.renderProductCommercialSummary({ quantitySold: 2, revenue: 240, relatedDocuments: [], lastDocument: { type: "invoice", invoiceNumber: "FAC-1", createdAt: "2026-01-01" } });
  assert.equal(b.elements.get("productSoldQuantity").textContent, "2 unités");
  assert.equal(b.elements.get("productLastDocument").textContent, "Facture · FAC-1");
  b.context.renderProductCommercialSummary({ quantitySold: 0, revenue: 0, relatedDocuments: [], lastDocument: null });
  assert.equal(b.elements.get("productLastDocument").textContent, "Aucun document");
});

test("product document presentation centralizes document details and payment state", () => {
  const b = browser();
  const presentation = b.context.getProductDocumentPresentation({
    _id: "invoice", type: "invoice", invoiceNumber: "FAC-1", paymentStatus: "paid", createdAt: "2026-01-01", totalTTC: 120
  });
  assert.deepEqual(plain(presentation), {
    id: "invoice", typeLabel: "Facture", number: "FAC-1", paymentLabel: "Encaissée",
    dateLabel: b.read("new Date('2026-01-01').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })"),
    totalLabel: b.context.formatProductCurrency(120)
  });
  assert.equal(b.context.getProductDocumentPresentation({ type: "order", createdAt: "2026-01-01" }).paymentLabel, "Voir le détail");
});

test("product commercial summary presentation centralizes labels, activity and empty history", () => {
  const b = browser();
  const presentation = b.context.getProductCommercialSummaryPresentation({ quantitySold: 2, revenue: 240, relatedDocuments: [{ _id: "invoice", type: "invoice", invoiceNumber: "FAC-1", paymentStatus: "paid", createdAt: "2026-01-01", totalTTC: 120 }], lastDocument: { type: "invoice", invoiceNumber: "FAC-1", createdAt: "2026-01-01" } });
  assert.deepEqual(plain(presentation), {
    quantityLabel: "2 unités", revenueLabel: b.context.formatProductCurrency(240), lastDocumentLabel: "Facture · FAC-1",
    lastDocumentDateLabel: b.read("new Date('2026-01-01').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })"),
    history: { countLabel: "1 document", emptyMessage: "Aucun document commercial ne contient encore ce produit.", items: [plain(b.context.getProductDocumentPresentation({ _id: "invoice", type: "invoice", invoiceNumber: "FAC-1", paymentStatus: "paid", createdAt: "2026-01-01", totalTTC: 120 }))] }
  });
  assert.deepEqual(plain(b.context.getProductCommercialSummaryPresentation({ unavailable: true })), { quantityLabel: "Indisponible", revenueLabel: "Indisponible", lastDocumentLabel: "Activité indisponible", lastDocumentDateLabel: "Réessayez dans quelques instants", history: { countLabel: "0 document", emptyMessage: "Aucun document commercial ne contient encore ce produit.", items: [] } });
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
  assert.match(b.context.renderStockHistory([]), /Aucun mouvement/);
  b.context.apiFetch = async () => [{ quantity: -2, type: "sale", createdAt: "2026-01-01", documentId: { invoiceNumber: "<img src=x>" } }];
  assert.match(await b.context.getStockHistoryMarkup("product"), /&lt;img src=x&gt;/);
  b.context.apiFetch = async () => { throw new Error("<script>failure</script>"); };
  assert.doesNotMatch(await b.context.getStockHistoryMarkup("product"), /<script>/);
});

test("stock history presentation centralizes movement direction and document reference", () => {
  const b = browser(); const restock = b.context.getStockHistoryPresentation({ quantity: 3, type: "restock", createdAt: "2026-01-01", documentId: { invoiceNumber: "F-1" } });
  assert.deepEqual(plain(restock), { className: "stock-history-row in", label: "Réassort", documentNumber: " · F-1", quantityLabel: "+3", dateLabel: b.read("new Date('2026-01-01').toLocaleDateString('fr-FR')") });
  assert.equal(b.context.getStockHistoryPresentation({ quantity: -2, type: "sale", createdAt: "2026-01-01" }).className, "stock-history-row out");
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

test("restock helpers centralize urgent selection and supplier grouping without mutating products", () => {
  const b = browser();
  const products = [
    product({ _id: "low", stock: 4, supplierName: "Zeta" }),
    product({ _id: "empty", stock: 0, lowStockThreshold: 0, supplierName: "Alpha" }),
    product({ _id: "healthy", stock: 8, lowStockThreshold: 5 })
  ];
  assert.deepEqual(plain(b.context.getUrgentRestockProducts(products).map(item => item._id)), ["empty", "low"]);
  assert.equal(b.context.getSuggestedRestockQuantity(products[0]), 6);
  assert.deepEqual(plain(b.context.groupRestockProductsBySupplier(products).map(([supplier]) => supplier)), ["Alpha", "Zeta"]);
  assert.equal(products[0]._id, "low");
});

test("restock order presentation centralizes supplier documents and escaped product details", () => {
  const b = browser();
  const orders = b.context.getRestockOrderPresentation([product({ stock: 2, name: "<Article>", supplierName: "Alpha", reference: "A-1", supplierReference: "F-1" })], "15/09/2026");
  assert.deepEqual(plain(orders), [{ number: "BC-R001", supplier: "Alpha", dateLabel: "15/09/2026", products: [{ name: "&lt;Article&gt;", reference: "A-1", supplierReference: "F-1", stock: 2, suggestedQuantity: 8 }] }]);
  assert.match(b.context.renderRestockOrderSections(orders), /BC-R001/);
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
