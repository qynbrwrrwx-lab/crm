const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const frontend = path.resolve(__dirname, "../../frontend");
const html = fs.readFileSync(path.join(frontend, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script\s+src="([^"]+)"[^>]*>/g)].map(match => match[1]);
const invoiceScripts = scripts.filter(src => src === "/js/invoices.js" || src.startsWith("/js/invoices/"));
const plain = value => JSON.parse(JSON.stringify(value));

function element() {
  const classes = new Set();
  return {
    value: "", innerHTML: "", textContent: "", innerText: "", disabled: false,
    style: { display: "none" }, dataset: {},
    classList: {
      add: name => classes.add(name), remove: name => classes.delete(name),
      contains: name => classes.has(name),
      toggle(name, force) {
        const enabled = force ?? !classes.has(name);
        if (enabled) classes.add(name); else classes.delete(name);
        return enabled;
      }
    },
    focus() {}, querySelectorAll() { return []; }
  };
}

function browser() {
  const elements = new Map();
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) elements.set(match[1], element());
  const selectors = new Map();
  const calls = [], toasts = [], windows = [], timers = [];
  const context = vm.createContext({
    console: { error() {} }, structuredClone,
    document: {
      getElementById: id => elements.get(id) || null,
      querySelectorAll: selector => selectors.get(selector) || []
    },
    apiFetch: async (...args) => { calls.push(args); throw new Error("Unexpected API call"); },
    showToast: message => toasts.push(message), showLoader() {}, hideLoader() {},
    confirmAppAction: async () => true, renderTreasury() {}, updateBusinessKPI() {},
    loadProducts: async () => {}, getToken: () => "test-session", API_URL: "https://test.invalid",
    URL: { createObjectURL: () => "blob:test-pdf", revokeObjectURL() {} },
    setTimeout: (callback, delay) => timers.push({ callback, delay }),
    open: (...args) => windows.push(args)
  });
  context.window = context;
  for (const src of ["/js/core/text.js", "/js/core/formatters.js", ...invoiceScripts]) {
    vm.runInContext(fs.readFileSync(path.join(frontend, src), "utf8"), context, { filename: src, timeout: 5000 });
  }
  return {
    context, calls, toasts, windows, timers, elements, selectors,
    read: expression => vm.runInContext(expression, context),
    addElement(id) { const node = element(); elements.set(id, node); return node; }
  };
}

function documentFixture(overrides = {}) {
  return {
    _id: "document", invoiceNumber: "FAC-001", type: "invoice", status: "draft",
    createdAt: "2026-01-01T12:00:00Z", paymentStatus: "pending", totalHT: 100, totalTTC: 120,
    contactId: { _id: "contact", companyName: "Client <script>alert(1)</script>", email: "client@example.com" },
    products: [{ productId: { _id: "product", name: "New catalog name", priceHT: 999, tva: 20 }, productName: "Historical <article>", quantity: 1, unitHT: 100, unitTTC: 120, tva: 20, lineHT: 100, lineTTC: 120, discount: 0 }],
    payments: [], ...overrides
  };
}

test("invoice scripts load exactly once before application initialization", () => {
  assert.equal(invoiceScripts[0], "/js/invoices.js");
  assert.equal(new Set(invoiceScripts).size, invoiceScripts.length);
  const files = fs.readdirSync(path.join(frontend, "js/invoices")).filter(file => file.endsWith(".js"));
  assert.deepEqual(invoiceScripts.slice(1).map(src => path.basename(src)).sort(), files.sort());
  for (const src of invoiceScripts) {
    assert.ok(scripts.indexOf(src) < scripts.indexOf("/js/app.js"));
    assert.ok(scripts.indexOf(src) > scripts.indexOf("/js/core/formatters.js"));
  }
  const b = browser();
  for (const name of ["toggleQuoteForm", "createQuote", "openInvoice", "confirmInvoicePayment", "convertQuoteToOrder", "convertOrderToInvoice", "viewQuote"]) {
    assert.equal(typeof b.context[name], "function", name);
  }
  assert.equal(b.calls.length, 0, "Loading scripts must not make API requests");
});

test("document lists retain their categories and escape customer text", () => {
  const b = browser();
  b.context.renderInvoices([
    documentFixture(),
    documentFixture({ _id: "quote", invoiceNumber: "DEV-001", type: "quote" }),
    documentFixture({ _id: "accepted", invoiceNumber: "DEV-002", type: "quote", status: "accepted" }),
    documentFixture({ _id: "order", invoiceNumber: "CMD-001", type: "order" }),
    documentFixture({ _id: "credit", invoiceNumber: "AV-001", type: "credit_note" })
  ]);
  for (const [id, number] of [["invoiceList", "FAC-001"], ["quotesContainer", "DEV-001"], ["acceptedQuotesContainer", "DEV-002"], ["ordersContainer", "CMD-001"]]) {
    assert.ok(b.elements.get(id).innerHTML.includes(number));
    assert.ok(!b.elements.get(id).innerHTML.includes("<script>"));
    assert.ok(b.elements.get(id).innerHTML.includes("&lt;script&gt;"));
  }
  assert.match(b.elements.get("invoiceList").innerHTML, /AV-001/);
  assert.doesNotMatch(b.elements.get("invoiceList").innerHTML, /DEV-001|CMD-001/);
});

test("invoice row presentation distinguishes payment and document workflows", () => {
  const b = browser();
  const partial = b.context.getInvoiceListRowPresentation(documentFixture({ paymentStatus: "partial" }));
  assert.deepEqual(plain(partial.payment), { className: "due-soon", label: "Partiellement réglée" });
  assert.deepEqual(plain(partial.document), { className: "due-soon", label: "Partiellement réglée" });
  const declined = b.context.getInvoiceListRowPresentation(documentFixture({ type: "quote", status: "declined" }));
  assert.deepEqual(plain(declined.document), { className: "overdue", label: "Devis refusé" });
  const convertedOrder = b.context.getInvoiceListRowPresentation(documentFixture({ type: "order", fulfillmentStatus: "shipped", convertedToInvoiceId: "invoice" }));
  assert.match(convertedOrder.document.label, /Facturée/);
});

test("invoice search, status and electronic filters combine and reset", () => {
  const b = browser();
  b.context.fixtures = [
    documentFixture({ _id: "paid", invoiceNumber: "FAC-PAID", paymentStatus: "paid", electronicTransmission: { status: "ready" } }),
    documentFixture({ _id: "pending", invoiceNumber: "FAC-PENDING" })
  ];
  b.read("allInvoices = fixtures");
  b.elements.get("invoiceSearch").value = "paid";
  b.elements.get("invoiceStatusFilter").value = "paid";
  b.elements.get("electronicInvoiceStatusFilter").value = "ready";
  b.context.filterInvoices();
  assert.match(b.elements.get("invoiceList").innerHTML, /FAC-PAID/);
  assert.doesNotMatch(b.elements.get("invoiceList").innerHTML, /FAC-PENDING/);
  b.context.resetInvoiceFilters();
  assert.match(b.elements.get("invoiceList").innerHTML, /FAC-PENDING/);
  assert.equal(b.elements.get("invoiceSearch").value, "");
});

test("invoice form option helpers keep invoice and quote labels distinct and escaped", () => {
  const b = browser();
  const contacts = [{ _id: "contact", firstname: "Ada", lastname: "<Lovelace>", companyName: "<Company>" }];
  const products = [{ _id: "product", name: "<Service>", stock: 0 }];
  assert.match(b.context.renderInvoiceContactOptions(contacts), /&lt;Company&gt;/);
  assert.match(b.context.renderInvoiceProductOptions(products), /\(0 stock\)/);
  assert.doesNotMatch(b.context.renderQuoteContactOptions(contacts), /Company/);
  assert.match(b.context.renderQuoteProductOptions(products), /&lt;Service&gt; — stock : 0/);
});

test("loading documents updates the shared state, treasury and dashboard", async () => {
  const b = browser();
  const documents = [documentFixture()];
  let treasuryCalls = 0, dashboardDocuments;
  b.context.apiFetch = async url => { assert.equal(url, "/api/invoices"); return documents; };
  b.context.renderTreasury = () => treasuryCalls++;
  b.context.updateBusinessKPI = value => { dashboardDocuments = value; };
  await b.context.loadInvoices();
  assert.deepEqual(plain(b.read("allInvoices")), documents);
  assert.equal(treasuryCalls, 1);
  assert.equal(dashboardDocuments, documents);
});

test("sales export includes invoices and credit notes while excluding quotes", async () => {
  const b = browser();
  const documents = [
    documentFixture({ invoiceNumber: "FAC-001", type: "invoice", paymentStatus: "paid", paymentMethod: "card" }),
    documentFixture({ invoiceNumber: "AV-001", type: "credit_note" }),
    documentFixture({ invoiceNumber: "DEV-001", type: "quote" }),
    documentFixture({ invoiceNumber: "CMD-001", type: "order" })
  ];
  b.context.apiFetch = async url => { assert.equal(url, "/api/invoices"); return documents; };
  let exported;
  b.context.downloadCsvFile = (lines, label) => { exported = { lines, label }; };
  await b.context.exportSalesCsv();
  assert.equal(exported.label, "ventes");
  assert.equal(exported.lines.length, 3);
  assert.deepEqual(plain(exported.lines.map(row => row.slice(1, 3))), [["Type", "Numero"], ["Facture", "FAC-001"], ["Avoir", "AV-001"]]);
});

for (const [action, endpoint] of [["convertQuoteToOrder", "convert-to-order"], ["convertOrderToInvoice", "convert-to-invoice"]]) {
  test(`${action} prevents duplicate clicks and unlocks after completion`, async () => {
    const b = browser();
    const calls = [], opened = [];
    let resolveRequest;
    b.context.apiFetch = (url, options) => { calls.push([url, options.method]); return new Promise(resolve => { resolveRequest = resolve; }); };
    b.context.loadInvoices = async () => {};
    b.context.openInvoice = async id => opened.push(id);
    const first = b.context[action]("source");
    const second = b.context[action]("source");
    await new Promise(setImmediate);
    assert.deepEqual(calls, [[`/api/invoices/${endpoint}/source`, "POST"]]);
    resolveRequest({ _id: "created", invoiceNumber: "DOC-1" });
    await Promise.all([first, second]);
    assert.deepEqual(opened, ["created"]);
    assert.equal(b.read("documentActionLocks.size"), 0);
  });
}

for (const [action, endpoint, method, status] of [
  ["deleteInvoice", "/api/invoices/source", "DELETE"],
  ["updateOrderFulfillment", "/api/invoices/source/fulfillment-status", "PUT", "prepared"]
]) {
  test(`${action} prevents duplicate clicks and releases its lock`, async () => {
    const b = browser();
    const calls = [];
    let resolveRequest;
    b.context.apiFetch = (url, options) => {
      calls.push([url, options.method, options.body]);
      return new Promise(resolve => { resolveRequest = resolve; });
    };
    b.context.loadInvoices = async () => {};
    b.context.loadInvoiceData = async () => {};
    const first = b.context[action]("source", status);
    const second = b.context[action]("source", status);
    await new Promise(setImmediate);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], endpoint);
    assert.equal(calls[0][1], method);
    resolveRequest({});
    await Promise.all([first, second]);
    assert.equal(b.read("documentActionLocks.size"), 0);
  });
}

test("failed commercial action restores the button and permits retry", async () => {
  const b = browser();
  const button = element();
  button.dataset = { documentId: "source", documentAction: "accept" };
  button.textContent = "Accepter";
  b.selectors.set("[data-document-action]", [button]);
  let attempts = 0;
  b.context.apiFetch = async () => { attempts++; throw new Error("API unavailable"); };
  await b.context.acceptQuote("source");
  await b.context.acceptQuote("source");
  assert.equal(attempts, 2);
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, "Accepter");
  assert.equal(button.classList.contains("is-loading"), false);
  assert.equal(b.read("documentActionLocks.size"), 0);
});

test("accepted quote refreshes the list and its active detail", async () => {
  const b = browser();
  b.read('currentInvoiceId = "source"');
  let refreshes = 0;
  const reopened = [];
  b.context.apiFetch = async (url, options) => {
    assert.equal(url, "/api/invoices/accept/source");
    assert.equal(options.method, "PUT");
  };
  b.context.loadInvoices = async () => { refreshes++; };
  b.context.openInvoice = async id => reopened.push(id);
  await b.context.acceptQuote("source");
  assert.equal(refreshes, 1);
  assert.deepEqual(reopened, ["source"]);
});

test("cancelled conversion makes no request", async () => {
  const b = browser();
  b.context.confirmAppAction = async () => false;
  await b.context.convertQuoteToOrder("source");
  assert.equal(b.calls.length, 0);
});

test("payment dialog computes the unpaid balance and rejects an excessive amount", async () => {
  const b = browser();
  const invoice = documentFixture({ payments: [{ amount: 20 }] });
  b.context.apiFetch = async url => { assert.equal(url, "/api/invoices"); return [invoice]; };
  await b.context.markInvoicePaid("document");
  assert.equal(b.elements.get("paymentAmountInput").value, "100.00");
  b.context.selectPaymentMethod("Virement bancaire");
  b.elements.get("paymentAmountInput").value = "101";
  await b.context.confirmInvoicePayment();
  assert.match(b.toasts.at(-1), /montant valide/);
  b.context.closePaymentModal();
  assert.equal(b.read("paymentInvoiceId"), null);
  assert.equal(b.elements.get("paymentModal").style.display, "none");
});

test("payment helpers prepare the remaining balance and distinguish partial confirmation", () => {
  const b = browser();
  const invoice = documentFixture({ payments: [{ amount: 20 }] });
  const payment = b.context.getPaymentModalData(invoice);
  assert.deepEqual(plain(payment), { invoiceId: "document", invoiceNumber: "FAC-001", remainingAmount: 100, amountLabel: "100.00 € TTC" });
  assert.equal(b.context.isValidPaymentAmount(100.001, 100), true);
  assert.equal(b.context.isValidPaymentAmount(100.01, 100), false);
  assert.match(b.context.getPaymentConfirmationMessage({ ...invoice, paymentStatus: "partial", payments: [{ amount: 20 }, { amount: 30 }] }, "Virement"), /reste 70.00 €/);
  assert.throws(() => b.context.getPaymentModalData({ type: "quote" }), /Facture introuvable/);
});

test("partial payment sends the amount and displays the remaining balance", async () => {
  const b = browser();
  const invoice = documentFixture({ payments: [{ amount: 20 }] });
  let payment;
  b.context.apiFetch = async (url, options) => {
    if (!options) return [invoice];
    assert.equal(url, "/api/invoices/pay/document");
    assert.equal(options.method, "PUT");
    payment = JSON.parse(options.body);
    return { ...invoice, paymentStatus: "partial", payments: [{ amount: 20 }, { amount: 30 }] };
  };
  b.context.loadInvoices = async () => {};
  await b.context.markInvoicePaid("document");
  b.context.selectPaymentMethod("Virement bancaire");
  b.elements.get("paymentAmountInput").value = "30";
  await b.context.confirmInvoicePayment();
  assert.deepEqual(payment, { paymentMethod: "Virement bancaire", amount: 30 });
  assert.match(b.toasts.at(-1), /reste 70\.00 €/);
  assert.equal(b.elements.get("confirmPaymentButton").disabled, false);
  assert.equal(b.read("documentActionLocks.size"), 0);
});

test("quote request helper keeps creation and edit API contracts distinct", () => {
  const b = browser();
  const products = [{ productId: "product", quantity: 2, discount: 0 }];
  assert.deepEqual(plain(b.context.getQuoteSaveRequest(null, "client", products)), {
    url: "/api/invoices", method: "POST", body: { type: "quote", contactId: "client", paymentMethod: "pending", products }, successMessage: "Devis créé ✅"
  });
  assert.deepEqual(plain(b.context.getQuoteSaveRequest("quote", "client", products)), {
    url: "/api/invoices/quote", method: "PUT", body: { type: "quote", contactId: "client", paymentMethod: "pending", products }, successMessage: "Devis modifié ✅"
  });
});

test("quote creation preserves the request format and resets its form", async () => {
  const b = browser();
  b.elements.get("quoteContact").value = "client";
  b.selectors.set(".quote-line", [{ querySelector: selector => ({ value: selector === ".quote-product" ? "product" : "2" }) }]);
  let request;
  b.context.apiFetch = async (url, options) => { request = { url, method: options.method, body: JSON.parse(options.body) }; };
  b.context.loadInvoices = async () => {};
  await b.context.createQuote();
  assert.deepEqual(request, { url: "/api/invoices", method: "POST", body: { type: "quote", contactId: "client", paymentMethod: "pending", products: [{ productId: "product", quantity: 2, discount: 0 }] } });
  assert.equal(b.read("editingQuoteId"), null);
  assert.equal(b.elements.get("quoteModal").style.display, "none");
});

test("quote creation prevents duplicate submissions and releases its lock", async () => {
  const b = browser();
  b.elements.get("quoteContact").value = "client";
  b.selectors.set(".quote-line", [{ querySelector: selector => ({ value: selector === ".quote-product" ? "product" : "2" }) }]);
  let calls = 0, resolveRequest;
  b.context.apiFetch = () => {
    calls++;
    return new Promise(resolve => { resolveRequest = resolve; });
  };
  b.context.loadInvoices = async () => {};
  const first = b.context.createQuote();
  const second = b.context.createQuote();
  await new Promise(setImmediate);
  assert.equal(calls, 1);
  resolveRequest({});
  await Promise.all([first, second]);
  assert.equal(b.read("documentActionLocks.size"), 0);
});

test("invoice creation keeps its API payload and reloads the form data", async () => {
  const b = browser();
  b.addElement("invoiceContact").value = "client";
  b.addElement("invoiceProduct").value = "product";
  b.addElement("invoiceQuantity").value = "3";
  b.addElement("paymentMethod").value = "Virement";
  let request;
  let invoiceLoads = 0, productLoads = 0, formLoads = 0;
  b.context.apiFetch = async (url, options) => { request = { url, method: options.method, body: JSON.parse(options.body) }; };
  b.context.loadInvoices = async () => { invoiceLoads++; };
  b.context.loadProducts = async () => { productLoads++; };
  b.context.loadInvoiceData = async () => { formLoads++; };
  await b.context.createInvoice();
  assert.deepEqual(request, { url: "/api/invoices", method: "POST", body: { type: "invoice", contactId: "client", paymentMethod: "Virement", products: [{ productId: "product", quantity: 3 }] } });
  assert.deepEqual([invoiceLoads, productLoads, formLoads], [1, 1, 1]);
  assert.equal(b.read("documentActionLocks.size"), 0);
});

test("invoice creation prevents duplicate submissions and releases its lock", async () => {
  const b = browser();
  b.addElement("invoiceContact").value = "client";
  b.addElement("invoiceProduct").value = "product";
  b.addElement("invoiceQuantity").value = "1";
  b.addElement("paymentMethod").value = "Virement";
  let calls = 0, resolveRequest;
  b.context.apiFetch = () => {
    calls++;
    return new Promise(resolve => { resolveRequest = resolve; });
  };
  b.context.loadInvoices = async () => {};
  b.context.loadProducts = async () => {};
  b.context.loadInvoiceData = async () => {};
  const first = b.context.createInvoice();
  const second = b.context.createInvoice();
  await new Promise(setImmediate);
  assert.equal(calls, 1);
  resolveRequest({});
  await Promise.all([first, second]);
  assert.equal(b.read("documentActionLocks.size"), 0);
});

test("historical invoice totals remain independent of current catalog prices", () => {
  const b = browser();
  b.context.fixture = documentFixture();
  b.read("currentInvoice = structuredClone(fixture)");
  b.context.recalculateInvoice();
  const invoice = plain(b.read("currentInvoice"));
  assert.equal(invoice.totalHT, 100);
  assert.equal(invoice.totalTTC, 120);
  assert.equal(invoice.products[0].productName, "Historical <article>");
});

test("invoice editor applies inputs and refreshes line and summary totals", () => {
  const b = browser();
  const invoice = documentFixture({
    products: [{ productId: { _id: "product", name: "Service", priceHT: 10, tva: 20 }, quantity: 1, discount: 0 }]
  });
  b.context.invoice = invoice;
  b.read("currentInvoice = structuredClone(invoice)");
  b.read("isEditingQuote = true");
  b.selectors.set(".edit-qty", [{ value: "2" }]);
  b.selectors.set(".edit-discount", [{ value: "10" }]);
  const lineHT = element(), lineTTC = element();
  b.selectors.set(".line-total-ht", [lineHT]);
  b.selectors.set(".line-total-ttc", [lineTTC]);
  const totalHT = b.addElement("summaryTotalHT");
  const totalTVA = b.addElement("summaryTVA");
  const totalTTC = b.addElement("summaryTotalTTC");
  b.context.recalculateInvoice();
  const updated = plain(b.read("currentInvoice"));
  assert.equal(updated.products[0].quantity, 2);
  assert.equal(updated.products[0].discount, 10);
  assert.equal(updated.totalHT, 18);
  assert.equal(updated.totalTTC, 21.6);
  assert.equal(lineHT.textContent, "18.00 €");
  assert.equal(lineTTC.textContent, "21.60 €");
  assert.equal(totalHT.textContent, "18.00 €");
  assert.equal(totalTVA.textContent, "3.60 €");
  assert.equal(totalTTC.textContent, "21.60 €");
});

test("editable document lines delegate field sizing to the commerce stylesheet", () => {
  const b = browser();
  const result = b.context.renderInvoiceDetailProducts(documentFixture(), true);
  assert.match(result, /class="edit-qty"/);
  assert.match(result, /class="edit-discount"/);
  assert.doesNotMatch(result, /style=/);
  const commerceStyles = fs.readFileSync(path.join(frontend, "styles/commerce.css"), "utf8");
  assert.match(commerceStyles, /\.edit-qty \{ width:60px/);
  assert.match(commerceStyles, /\.edit-discount \{ width:65px/);
});

test("product picker delegates search field styling to the commerce stylesheet", () => {
  const b = browser();
  b.context.renderInvoiceProductPicker([{ _id: "product", name: "Produit <test>", priceHT: 12 }]);
  const result = b.elements.get("addProductBody").innerHTML;
  assert.match(result, /class="product-picker-search"/);
  assert.match(result, /Produit &lt;test&gt;/);
  assert.doesNotMatch(result, /style=/);
  const commerceStyles = fs.readFileSync(path.join(frontend, "styles/commerce.css"), "utf8");
  assert.match(commerceStyles, /\.product-picker-search \{ width:100%/);
});

for (const [type, expected] of [["quote", "Devis"], ["order", "Commande"], ["invoice", "Facture"], ["credit_note", "Avoir"]]) {
  test(`the ${type} detail view remains available after splitting scripts`, async () => {
    const b = browser();
    const invoice = documentFixture({ type });
    b.context.apiFetch = async url => url.endsWith("/activity") ? [] : [invoice];
    await b.context.openInvoice("document");
    assert.equal(b.elements.get("detailDocumentType").innerText, expected);
    assert.equal(b.elements.get("invoiceDetailsModal").style.display, "flex");
    assert.equal(b.read("currentInvoiceId"), "document");
    const body = b.elements.get("invoiceDetailsBody").innerHTML;
    assert.ok(!body.includes("<script>"));
    assert.ok(body.includes("&lt;script&gt;"));
    b.context.closeInvoiceDetails();
    assert.equal(b.read("currentInvoiceId"), null);
  });
}

test("PDF opening retains authenticated download and temporary URL cleanup", async () => {
  const b = browser();
  b.context.fetch = async (url, options) => {
    assert.equal(url, "https://test.invalid/api/invoices/pdf/document");
    assert.equal(options.headers.Authorization, "Bearer test-session");
    return { ok: true, blob: async () => ({}) };
  };
  let revoked;
  b.context.URL.revokeObjectURL = url => { revoked = url; };
  await b.context.viewQuote("document");
  assert.deepEqual(b.windows, [["blob:test-pdf", "_blank", "noopener"]]);
  assert.equal(b.timers[0].delay, 60000);
  b.timers[0].callback();
  assert.equal(revoked, "blob:test-pdf");
});

test("delivery note opening uses the shared authenticated PDF download", async () => {
  const b = browser();
  b.context.fetch = async (url, options) => {
    assert.equal(url, "https://test.invalid/api/invoices/document/delivery-note");
    assert.equal(options.headers.Authorization, "Bearer test-session");
    return { ok: true, blob: async () => ({}) };
  };
  await b.context.openDeliveryNote("document");
  assert.deepEqual(b.windows, [["blob:test-pdf", "_blank", "noopener"]]);
  assert.equal(b.timers[0].delay, 60000);
});

for (const [overrides, label, status] of [
  [{ type: "quote", status: "draft" }, "Devis", "En attente de décision"],
  [{ type: "quote", status: "accepted" }, "Devis", "Devis accepté"],
  [{ type: "quote", status: "declined" }, "Devis", "Devis refusé"],
  [{ type: "order", fulfillmentStatus: "shipped" }, "Commande", "Expédiée"],
  [{ paymentStatus: "partial" }, "Facture", "Partiellement réglée"],
  [{ paymentStatus: "paid" }, "Facture", "Payée"],
  [{ isDepositInvoice: true }, "Facture d’acompte", "En attente de paiement"],
  [{ type: "credit_note" }, "Avoir", "Avoir émis"]
]) {
  test(`detail presentation preserves ${label}: ${status}`, () => {
    const b = browser();
    const invoice = documentFixture(overrides);
    const before = structuredClone(invoice);
    const presentation = b.context.buildInvoiceDetailPresentation(invoice);
    assert.equal(presentation.documentTypeLabel, label);
    assert.equal(presentation.documentStatus, status);
    assert.deepEqual(invoice, before);
  });
}

test("detail presentation resolves linked document IDs in both API formats", () => {
  const b = browser();
  for (const ref of ["linked", { _id: "linked", invoiceNumber: "CMD-123" }]) {
    const result = b.context.buildInvoiceDetailPresentation(documentFixture({ type: "quote", convertedToOrderId: ref }));
    assert.equal(result.linkedDocument.id, "linked");
    assert.equal(result.linkedDocument.label, "Ouvrir la commande liée");
  }
});

test("detail template renders the supplied document without DOM access or shared state", () => {
  const b = browser();
  b.context.document = new Proxy({}, { get() { throw new Error("Template must not access the DOM"); } });
  const invoice = documentFixture();
  const editable = structuredClone(invoice);
  editable.products[0].productName = "Explicit line snapshot";
  const presentation = b.context.buildInvoiceDetailPresentation(invoice);
  const result = b.context.renderInvoiceDetailBody(invoice, editable, false, presentation);
  assert.match(result, /Explicit line snapshot/);
  assert.equal(b.read("currentInvoice"), null);
  assert.equal(b.calls.length, 0);
});

test("declined quote reasons are displayed as text, never interpreted as HTML", async () => {
  const b = browser();
  const reason = '<img src=x onerror="alert(1)"> & refus';
  const invoice = documentFixture({ type: "quote", status: "declined", clientDeclineReason: reason });
  b.context.apiFetch = async url => url.endsWith("/activity") ? [] : [invoice];
  await b.context.openInvoice("document");
  const body = b.elements.get("invoiceDetailsBody").innerHTML;
  assert.ok(body.includes(b.context.escapeHtml(`Motif du refus : ${reason}`)));
  assert.ok(!body.includes(reason));
  assert.ok(!body.includes("<img src=x"));
});

test("detail actions preserve the accepted quote conversion boundary", () => {
  const b = browser();
  for (const status of ["draft", "accepted"]) {
    const invoice = documentFixture({ type: "quote", status });
    const result = b.context.renderInvoiceDetailBody(invoice, invoice, false, b.context.buildInvoiceDetailPresentation(invoice));
    assert.equal(result.includes("convertQuoteToOrder('document')"), status === "accepted");
  }
});

test("detail actions keep each document workflow in its own action group", () => {
  const b = browser();
  const draftQuote = b.context.renderInvoiceDetailActions(documentFixture({ type: "quote", status: "draft" }), false, null);
  assert.match(draftQuote, /acceptQuote\('document'\)/);
  assert.match(draftQuote, /duplicateQuote\('document'\)/);
  assert.match(draftQuote, /enableInvoiceEdition\(\)/);
  assert.doesNotMatch(draftQuote, /createDepositInvoice/);
  const order = b.context.renderInvoiceDetailActions(documentFixture({ type: "order", fulfillmentStatus: "prepared" }), false, null);
  assert.match(order, /openDeliveryNote\('document'\)/);
  assert.match(order, /updateOrderFulfillment\('document','shipped'\)/);
  assert.match(order, /convertOrderToInvoice\('document'\)/);
  const overdueInvoice = b.context.renderInvoiceDetailActions(documentFixture({ paymentDueDate: "2000-01-01" }), false, null);
  assert.match(overdueInvoice, /markInvoicePaid\('document'\)/);
  assert.match(overdueInvoice, /createCreditNote\('document'\)/);
  assert.match(overdueInvoice, /openPaymentReminder\('document'\)/);
});

test("detail action markup delegates layout styles to the commerce stylesheet", () => {
  const b = browser();
  const paidInvoice = documentFixture({ paymentStatus: "paid", paymentMethod: "Virement" });
  const result = b.context.renderInvoiceDetailActions(paidInvoice, false, null);
  assert.match(result, /class="invoice-detail-actions"/);
  assert.match(result, /class="invoice-paid-badge"/);
  assert.doesNotMatch(result, /style=/);
  const commerceStyles = fs.readFileSync(path.join(frontend, "styles/commerce.css"), "utf8");
  assert.match(commerceStyles, /\.invoice-detail-actions \{[^}]*display:flex/);
  assert.match(commerceStyles, /\.invoice-paid-badge \{[^}]*display:inline-flex/);
});

for (const [sort, expected] of [
  ["recent", ["new", "old"]], ["oldest", ["old", "new"]],
  ["amount-desc", ["old", "new"]], ["amount-asc", ["new", "old"]]
]) {
  test(`document selection sorts by ${sort} without changing its input`, () => {
    const b = browser();
    const documents = [
      documentFixture({ _id: "old", createdAt: "2025-01-01", totalTTC: 200 }),
      documentFixture({ _id: "new", createdAt: "2026-01-01", totalTTC: 100 })
    ];
    const before = structuredClone(documents);
    const selected = b.context.selectInvoiceList(documents, { sort });
    assert.deepEqual(plain(selected.sortedInvoices.map(item => item._id)), expected);
    assert.deepEqual(documents, before);
  });
}

test("document selection preserves global totals while filtering visible invoices", () => {
  const b = browser();
  const documents = [
    documentFixture({ _id: "paid", invoiceNumber: "FAC-PAID", paymentStatus: "paid", totalTTC: 100 }),
    documentFixture({ _id: "pending", totalTTC: 200, electronicTransmission: { status: "ready" } }),
    documentFixture({ _id: "quote", type: "quote", status: "accepted", totalTTC: 500 })
  ];
  const result = b.context.selectInvoiceList(documents, { search: "  fac-paid  ", status: "paid" });
  assert.deepEqual([...result.visibleInvoiceIds], ["paid"]);
  assert.equal(result.paidTotal, 100);
  assert.equal(result.pendingTotal, 200);
  assert.equal(result.electronicReadyCount, 1);
  assert.equal(result.acceptedQuotes.length, 1);
});

test("overdue selection excludes paid invoices and documents without an invoice due date", () => {
  const b = browser();
  const documents = [
    documentFixture({ _id: "late", paymentDueDate: "2000-01-01" }),
    documentFixture({ _id: "paid", paymentDueDate: "2000-01-01", paymentStatus: "paid" }),
    documentFixture({ _id: "quote", type: "quote", paymentDueDate: "2000-01-01" }),
    documentFixture({ _id: "no-date" })
  ];
  assert.deepEqual([...b.context.selectInvoiceList(documents, { status: "overdue" }).visibleInvoiceIds], ["late"]);
});

test("empty selection and row rendering work without DOM access", () => {
  const b = browser();
  b.context.document = new Proxy({}, { get() { throw new Error("Selection and row renderer must not access the DOM"); } });
  const selected = b.context.selectInvoiceList([]);
  assert.equal(selected.visibleInvoiceIds.size, 0);
  assert.equal(selected.paidTotal, 0);
  assert.equal(selected.pendingTotal, 0);
  const row = b.context.renderInvoiceListRow(documentFixture());
  assert.match(row, /FAC-001/);
  assert.match(row, /&lt;script&gt;/);
  assert.doesNotMatch(row, /<script>/);
  assert.equal(b.calls.length, 0);
});

test("quote submission refuses a missing customer or empty product list", async () => {
  const b = browser();
  await b.context.createQuote();
  assert.match(b.toasts.at(-1), /Sélectionnez un contact/);
  b.elements.get("quoteContact").value = "client";
  await b.context.createQuote();
  assert.match(b.toasts.at(-1), /au moins un article/);
  assert.equal(b.calls.length, 0);
});

test("editing a quote sends PUT to its existing document and resets editing after success", async () => {
  const b = browser();
  b.read('editingQuoteId = "existing"');
  b.elements.get("quoteContact").value = "client";
  b.selectors.set(".quote-line", [{ querySelector: selector => ({ value: selector === ".quote-product" ? "product" : "3" }) }]);
  let request;
  b.context.apiFetch = async (url, options) => { request = { url, method: options.method, body: JSON.parse(options.body) }; };
  b.context.loadInvoices = async () => {};
  await b.context.createQuote();
  assert.equal(request.url, "/api/invoices/existing");
  assert.equal(request.method, "PUT");
  assert.equal(request.body.products[0].quantity, 3);
  assert.equal(b.read("editingQuoteId"), null);
  assert.match(b.toasts.at(-1), /Devis modifié/);
});

test("failed quote submission keeps the form and editing document available for retry", async () => {
  const b = browser();
  b.read('editingQuoteId = "existing"');
  b.elements.get("quoteContact").value = "client";
  b.elements.get("quoteModal").style.display = "block";
  b.selectors.set(".quote-line", [{ querySelector: selector => ({ value: selector === ".quote-product" ? "product" : "1" }) }]);
  b.context.apiFetch = async () => { throw new Error("Save failed"); };
  await b.context.createQuote();
  assert.equal(b.read("editingQuoteId"), "existing");
  assert.equal(b.elements.get("quoteModal").style.display, "block");
  assert.equal(b.toasts.at(-1), "Save failed");
});

test("quote form loads selection data only when opening", async () => {
  const b = browser();
  let loads = 0;
  b.context.loadQuoteData = async () => loads++;
  await b.context.toggleQuoteForm();
  assert.equal(b.elements.get("quoteModal").style.display, "block");
  assert.equal(loads, 1);
  await b.context.toggleQuoteForm();
  assert.equal(b.elements.get("quoteModal").style.display, "none");
  assert.equal(loads, 1);
});

test("quote draft summary keeps quantities, totals and stock warnings consistent", () => {
  const b = browser();
  b.context.catalog = [{ _id: "product", priceHT: 10, tva: 20, stock: 2 }];
  b.read('quoteProductsById = new Map(catalog.map(item => [item._id, item]))');
  let quantity = "3";
  b.selectors.set(".quote-line", [{ querySelector: selector => ({ value: selector === ".quote-product" ? "product" : quantity }) }]);
  b.context.updateQuoteDraftSummary();
  assert.equal(b.elements.get("quoteDraftCount").textContent, "3 articles");
  assert.equal(b.elements.get("quoteDraftTotal").textContent, b.context.formatDocumentCurrency(36));
  assert.equal(b.elements.get("quoteDraftAvailability").classList.contains("is-warning"), true);
  quantity = "1";
  b.context.updateQuoteDraftSummary();
  assert.equal(b.elements.get("quoteDraftAvailability").classList.contains("is-warning"), false);
  assert.equal(b.elements.get("quoteDraftAvailability").classList.contains("is-success"), true);
});
