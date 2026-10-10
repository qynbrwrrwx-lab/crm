const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const frontend = path.resolve(__dirname, "../../frontend");
const html = fs.readFileSync(path.join(frontend, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script\s+src="([^"]+)"[^>]*>/g)].map(match => match[1]);
const contactScripts = scripts.filter(src => src === "/js/contacts.js" || src.startsWith("/js/contacts/"));
const plain = value => JSON.parse(JSON.stringify(value));

function browser() {
  const elements = new Map(), listeners = [], toasts = [], calls = [];
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) {
    elements.set(match[1], { value: "", textContent: "", innerHTML: "", style: {}, dataset: {}, checked: false,
      classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, focus() {}, scrollIntoView() {} });
  }
  const context = vm.createContext({
    document: { getElementById: id => elements.get(id) || null, querySelector: () => null, querySelectorAll: () => [], addEventListener: (name, callback) => listeners.push({ name, callback }) },
    console: { warn() {}, error() {} },
    apiFetch: async (...args) => { calls.push(args); throw new Error("Unexpected API call"); },
    fetch: async () => { throw new Error("Geocoding unavailable"); },
    showToast: message => toasts.push(message), showLoader() {}, hideLoader() {},
    confirmAppAction: async () => true, loadInvoiceData: async () => {},
    taskContacts() {}, opportunityContacts() {}, updateKPI() {}, updateClientFollowUpAlert() {}, updateChart() {},
    map: null, markers: [], setTimeout() {}
  });
  context.window = context;
  for (const src of ["/js/core/text.js", "/js/core/formatters.js", ...contactScripts]) {
    vm.runInContext(fs.readFileSync(path.join(frontend, src), "utf8"), context, { filename: src, timeout: 5000 });
  }
  return { context, elements, listeners, calls, toasts, read: expression => vm.runInContext(expression, context) };
}

function contact(overrides = {}) {
  return { _id: "client", type: "particulier", firstname: "Alice", lastname: "Martin", billingAddress: "1 rue Test", email: "alice@example.com", tags: [], ...overrides };
}

test("contact modules load once before application initialization and keep one DOM-ready listener", () => {
  assert.equal(contactScripts[0], "/js/contacts.js");
  assert.equal(new Set(contactScripts).size, contactScripts.length);
  assert.deepEqual(contactScripts.slice(1).map(src => path.basename(src)).sort(), fs.readdirSync(path.join(frontend, "js/contacts")).filter(name => name.endsWith(".js")).sort());
  for (const src of contactScripts) assert.ok(scripts.indexOf(src) < scripts.indexOf("/js/app.js"));
  const b = browser();
  assert.equal(b.listeners.length, 1);
  assert.equal(b.listeners[0].name, "DOMContentLoaded");
  b.listeners[0].callback();
  for (const name of ["addContact", "editContact", "loadContacts", "openClientProfile", "handleContactsCsvImport", "celebrateFormCard"]) assert.equal(typeof b.context[name], "function");
  assert.equal(b.calls.length, 0);
});

test("contact tags retain deduplication, whitespace normalization and size limits", () => {
  const b = browser();
  assert.deepEqual(plain(b.context.normalizeContactTags(" VIP , VIP,  Grand   compte, ," + "x".repeat(33))), ["VIP", "Grand compte"]);
  assert.equal(b.context.normalizeContactTags(Array.from({ length: 12 }, (_, i) => `tag${i}`).join(",")).length, 10);
});

test("contact cards escape customer text and render an empty state", () => {
  const b = browser();
  b.context.renderContacts([contact({ firstname: "<img src=x>", tags: ["<b>VIP</b>"] })]);
  assert.match(b.elements.get("list").innerHTML, /&lt;img src=x&gt;/);
  assert.doesNotMatch(b.elements.get("list").innerHTML, /<img src=x>|<b>VIP/);
  b.context.renderContacts([]);
  assert.match(b.elements.get("list").innerHTML, /Aucun contact/);
});

test("contact card presentation centralizes defaults and follow-up data", () => {
  const b = browser();
  const presentation = b.context.getContactCardPresentation(contact({ firstname: "", lastname: "", nextFollowUpAt: "2000-01-01", favorite: true }));
  assert.equal(presentation.fullName, "");
  assert.equal(presentation.companyName, "Client particulier");
  assert.equal(presentation.favorite, true);
  assert.equal(presentation.followUp.overdue, true);
});

test("contact search combines text and due follow-ups without changing the shared list", () => {
  const b = browser();
  b.context.fixtures = [contact({ _id: "due", tags: ["VIP"], nextFollowUpAt: "2000-01-01" }), contact({ _id: "future", tags: ["VIP"], nextFollowUpAt: "2099-01-01" }), contact({ _id: "other", lastname: "Durand" })];
  b.read("allContacts = fixtures");
  b.elements.get("search").value = " vip ";
  b.elements.get("contactFollowUpFilter").value = "due";
  let rendered;
  b.context.renderContacts = contacts => { rendered = contacts; };
  b.context.filterContacts();
  assert.deepEqual(plain(rendered.map(item => item._id)), ["due"]);
  assert.equal(b.read("allContacts.length"), 3);
});

test("editing and cancelling a contact keeps form state and shipping address synchronized", () => {
  const b = browser();
  b.context.fixtures = [contact({ shippingAddress: "1 rue Test", tags: ["VIP"] })];
  b.read("allContacts = fixtures");
  b.context.editContact("client");
  assert.equal(b.read("editingContactId"), "client");
  assert.equal(b.elements.get("contactTags").value, "VIP");
  assert.equal(b.elements.get("shippingAddress").readOnly, true);
  b.context.cancelContactEdit();
  assert.equal(b.read("editingContactId"), null);
  assert.equal(b.elements.get("firstname").value, "");
  assert.equal(b.elements.get("shippingAddress").readOnly, false);
});

test("contact save still works when geocoding fails and uses PUT for an edit", async () => {
  const b = browser();
  b.read('editingContactId = "client"');
  b.elements.get("billingAddress").value = "1 rue Test";
  b.elements.get("lastname").value = "Martin";
  b.elements.get("type").value = "particulier";
  let request;
  b.context.apiFetch = async (url, options) => { request = { url, method: options.method, data: JSON.parse(options.body) }; };
  b.context.loadContacts = async () => {};
  await b.context.addContact();
  assert.equal(request.url, "/api/contacts/client");
  assert.equal(request.method, "PUT");
  assert.equal(request.data.lat, null);
  assert.equal(request.data.lng, null);
  assert.equal(request.data.lastname, "Martin");
  assert.equal(b.read("editingContactId"), null);
});

test("contact save keeps geocoding coordinates for a new client", async () => {
  const b = browser();
  b.elements.get("billingAddress").value = "1 rue Test";
  b.elements.get("lastname").value = "Martin";
  b.context.fetch = async () => ({ ok: true, json: async () => [{ lat: "48.8566", lon: "2.3522" }] });
  let request;
  b.context.apiFetch = async (url, options) => { request = { url, method: options.method, data: JSON.parse(options.body) }; };
  b.context.loadContacts = async () => {};
  await b.context.addContact();
  assert.equal(request.url, "/api/contacts");
  assert.equal(request.method, "POST");
  assert.equal(request.data.lat, 48.8566);
  assert.equal(request.data.lng, 2.3522);
});

test("failed contact save preserves the edited values for retry", async () => {
  const b = browser();
  b.read('editingContactId = "client"');
  b.elements.get("billingAddress").value = "1 rue Test";
  b.context.apiFetch = async () => { throw new Error("Save failed"); };
  await b.context.addContact();
  assert.equal(b.read("editingContactId"), "client");
  assert.equal(b.elements.get("billingAddress").value, "1 rue Test");
  assert.equal(b.toasts.at(-1), "Save failed");
});

test("cancelled deletion and CSV import make no API requests", async () => {
  const b = browser();
  b.context.confirmAppAction = async () => false;
  b.context.readCsvImport = async () => [{ nom: "Martin", "adresse facturation": "1 rue Test" }];
  await b.context.deleteContact("client");
  await b.context.handleContactsCsvImport({});
  assert.equal(b.calls.length, 0);
});

test("CSV import skips invalid rows and reports partial failures", async () => {
  const b = browser();
  b.context.readCsvImport = async () => [{ nom: "Martin", "adresse facturation": "A" }, { nom: "Missing address" }, { entreprise: "Company", "adresse facturation": "B" }];
  const imported = [];
  b.context.apiFetch = async (url, options) => {
    assert.equal(url, "/api/contacts");
    assert.equal(options.method, "POST");
    imported.push(JSON.parse(options.body));
    if (imported.length === 2) throw new Error("Row failure");
  };
  b.context.loadContacts = async () => {};
  await b.context.handleContactsCsvImport({});
  assert.equal(imported.length, 2);
  assert.equal(imported[0].lastname, "Martin");
  assert.match(b.toasts.at(-1), /1 clients importés, 1 ligne/);
});

test("contact CSV helpers preserve exports and accept unaccented import aliases", () => {
  const b = browser();
  const lines = b.context.getContactCsvLines([contact({ companyName: "Acme", notes: "Suivi" })]);
  assert.equal(lines[0][0], "Type");
  assert.equal(lines[1][1], "Acme");
  const imported = b.context.getContactFromCsvRow({ entreprise: "Acme", prenom: "Alice", nom: "Martin", email: "alice@example.test", telephone: "0102030405", "adresse facturation": "1 rue Test" });
  assert.equal(imported.firstname, "Alice");
  assert.equal(imported.email, "alice@example.test");
  assert.equal(imported.phone, "0102030405");
  assert.equal(b.context.isValidContactCsvRow({ entreprise: "Acme", "adresse facturation": "1 rue Test" }), true);
  assert.equal(b.context.getContactImportMessage(3, [2]), "2 clients importés, 1 ligne(s) ignorée(s)");
});

test("client profile renders outstanding invoices and excludes other clients", async () => {
  const b = browser();
  b.context.fixtures = [contact()];
  b.read("allContacts = fixtures");
  b.context.apiFetch = async url => url === "/api/invoices" ? [
    { _id: "invoice", contactId: { _id: "client" }, type: "invoice", paymentStatus: "pending", totalTTC: 120, invoiceNumber: "FAC-OWN", createdAt: "2026-01-01" },
    { _id: "other", contactId: "other", type: "invoice", totalTTC: 999, invoiceNumber: "FAC-OTHER", createdAt: "2026-01-01" }
  ] : [];
  await b.context.openClientProfile("client");
  assert.equal(b.elements.get("invoiceDetailsModal").style.display, "flex");
  assert.match(b.elements.get("invoiceDetailsBody").innerHTML, /FAC-OWN/);
  assert.doesNotMatch(b.elements.get("invoiceDetailsBody").innerHTML, /FAC-OTHER/);
  assert.match(b.elements.get("invoiceDetailsBody").innerHTML, /Suivre le règlement/);
});

test("client profile data keeps only active related opportunities and suggests the right action", () => {
  const b = browser();
  const data = b.context.getClientProfileDataFromResources(contact(), {
    documents: [
      { _id: "paid", contactId: "client", type: "invoice", paymentStatus: "paid", totalTTC: 80, createdAt: "2026-01-01" },
      { _id: "pending", contactId: { _id: "client" }, type: "invoice", paymentStatus: "pending", totalTTC: 120, createdAt: "2026-02-01" },
      { _id: "other", contactId: "other", type: "invoice", paymentStatus: "pending", totalTTC: 900 }
    ],
    agendaItems: [{ _id: "task", contactId: "client", status: "open", dueDate: "2026-10-05" }, { _id: "done", contactId: "client", status: "done" }],
    opportunities: [{ _id: "active", contactId: "client", stage: "proposal" }, { _id: "won", contactId: "client", stage: "won" }]
  });
  assert.equal(data.total, 80);
  assert.equal(data.pending, 120);
  assert.deepEqual(plain(data.relatedAgenda.map(item => item._id)), ["task"]);
  assert.deepEqual(plain(data.relatedOpportunities.map(item => item._id)), ["active"]);
  assert.equal(data.nextAction.target, "invoices");
});

test("client profile history escapes titles and retains its empty sections", () => {
  const b = browser();
  const history = b.context.renderClientProfileHistory({
    relatedAgenda: [{ _id: "task", type: "appointment", title: "<Relance>", startDate: "2026-10-05T10:00:00Z", priority: "high" }],
    relatedOpportunities: [],
    related: []
  });
  assert.match(history, /&lt;Relance&gt;/);
  assert.match(history, /Prioritaire/);
  assert.match(history, /Aucune opportunité commerciale/);
  assert.match(history, /Aucun événement commercial/);
});

test("map popups escape contact names when loading shared contacts", async () => {
  const b = browser();
  b.context.map = { removeLayer() {} };
  b.context.apiFetch = async () => [contact({ firstname: "<img src=x>", lat: 48, lng: 2 })];
  let popup;
  b.context.L = { marker: () => ({ addTo() { return this; }, bindPopup(value) { popup = value; return this; } }) };
  await b.context.loadContacts();
  assert.match(popup, /&lt;img src=x&gt;/);
  assert.doesNotMatch(popup, /<img src=x>/);
  assert.equal(b.read("allContacts.length"), 1);
});
