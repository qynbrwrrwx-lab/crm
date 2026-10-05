const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const frontend = path.resolve(__dirname, "../../frontend");
const html = fs.readFileSync(path.join(frontend, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script\s+src="([^"]+)"[^>]*>/g)].map(match => match[1]);
const uiScripts = scripts.filter(src => src === "/js/ui.js" || src.startsWith("/js/ui/"));

function node() {
  const classes = new Set();
  return {
    value: "", textContent: "", innerText: "", innerHTML: "", style: {},
    classList: { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value), toggle: (value, enabled) => enabled ? classes.add(value) : classes.delete(value) },
    getAttribute() { return null; }, scrollIntoView() {}
  };
}

function browser() {
  const nodes = new Map(), events = [], requests = [], calls = [];
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) nodes.set(id, node());
  const sections = [node(), node()], sidebarButtons = [node(), node()], navButtons = [node(), node()];
  const context = vm.createContext({
    document: {
      getElementById: id => nodes.get(id) || null,
      querySelector: selector => selector === ".app-layout" ? nodes.get("app") : null,
      querySelectorAll: selector => selector === ".section" ? sections : selector === ".sidebar button" ? sidebarButtons : selector === ".sidebar nav button" ? navButtons : [],
      addEventListener: (name, callback) => events.push({ name, callback })
    },
    localStorage: { getItem: () => null, setItem: (...args) => calls.push(args) },
    setTimeout: callback => callback(), console: { error() {} },
    apiFetch: async (...args) => { requests.push(args); return []; },
    initMap: () => calls.push(["initMap"]),
    loadContacts: async () => calls.push(["contacts"]), loadProducts: async () => calls.push(["products"]),
    loadInvoices: async () => calls.push(["invoices"]), loadInvoiceData: async () => calls.push(["invoiceData"]),
    loadTasks: async () => calls.push(["tasks"]), loadOpportunities: async () => calls.push(["opportunities"]),
    loadSuppliers: async () => calls.push(["suppliers"]), loadExpenses: async () => calls.push(["expenses"]),
    loadExpenseBudgets: async () => calls.push(["budgets"]), loadTreasury: async () => calls.push(["treasury"]),
    loadCompanySetupStatus: async () => calls.push(["company"]), loadOnboardingChecklist: async () => calls.push(["onboarding"]), loadAccountActivity: async () => calls.push(["account"]),
    loadAnalytics: () => calls.push(["analytics"]), loadCompany: () => calls.push(["loadCompany"]), loadQuoteData: () => calls.push(["quotes"]),
    map: { invalidateSize: () => calls.push(["map"]) },
    getComputedStyle: element => ({ display: element.style.display || "none" })
  });
  context.window = context;
  vm.runInContext(fs.readFileSync(path.join(frontend, "js/core/text.js"), "utf8"), context);
  for (const src of uiScripts) vm.runInContext(fs.readFileSync(path.join(frontend, src), "utf8"), context, { filename: src });
  return { context, nodes, events, requests, calls, sections, sidebarButtons };
}

test("shared interface modules load once before domains and attach only their two listeners", () => {
  assert.equal(uiScripts[0], "/js/ui.js");
  assert.equal(new Set(uiScripts).size, uiScripts.length);
  assert.deepEqual(uiScripts.slice(1).map(src => path.basename(src)).sort(), fs.readdirSync(path.join(frontend, "js/ui")).filter(name => name.endsWith(".js")).sort());
  for (const src of uiScripts) assert.ok(scripts.indexOf(src) < scripts.indexOf("/js/admin.js"));
  const b = browser();
  assert.deepEqual(b.events.map(event => event.name), ["DOMContentLoaded", "keydown"]);
  assert.equal(b.requests.length, 0);
});

test("feedback handles pages without toast or loader and updates available elements", () => {
  const b = browser();
  b.nodes.delete("toast"); b.nodes.delete("loader");
  assert.doesNotThrow(() => { b.context.showToast("Message"); b.context.showLoader(); b.context.hideLoader(); });
  b.nodes.set("toast", node()); b.nodes.set("loader", node());
  b.context.showToast("Message"); b.context.showLoader(); assert.equal(b.nodes.get("loader").style.display, "flex");
  b.context.hideLoader(); assert.equal(b.nodes.get("loader").style.display, "none");
});

test("showApp opens the application and starts every existing domain loader", () => {
  const b = browser(); b.context.showApp();
  assert.equal(b.nodes.get("auth").style.display, "none"); assert.equal(b.nodes.get("app").style.display, "block");
  for (const name of ["initMap", "contacts", "tasks", "opportunities", "products", "suppliers", "expenses", "budgets", "treasury", "invoices", "invoiceData", "company", "onboarding", "account"]) {
    assert.ok(b.calls.some(call => call[0] === name), name);
  }
});

test("navigation saves the section, updates context and loads the target domain", () => {
  const b = browser(); b.context.showSection("treasurySection");
  assert.equal(b.nodes.get("appContextTitle").textContent, "Trésorerie");
  assert.ok(b.calls.some(call => call[0] === "treasury"));
  assert.ok(b.calls.some(call => call[0] === "my-prospect-active-section" && call[1] === "treasurySection"));
  assert.ok(b.sections.every(section => !section.classList.contains("active")));
});

test("favorites escape contact values before rendering and settings update the count", async () => {
  const b = browser(); b.nodes.set("favoritesList", node()); b.nodes.set("userStats", node());
  b.context.apiFetch = async () => [{ favorite: true, firstname: "<Alice>", lastname: "& Co", phone: "<script>", companyName: "<Company>" }];
  await b.context.loadFavorites(); const markup = b.nodes.get("favoritesList").innerHTML;
  assert.match(markup, /&lt;Alice&gt;/); assert.match(markup, /&lt;Company&gt;/); assert.doesNotMatch(markup, /<script>/);
  b.context.apiFetch = async () => [{}, {}]; await b.context.loadUserInfo(); assert.equal(b.nodes.get("userStats").innerText, 2);
});

test("Escape closes the first visible modal only", () => {
  const b = browser(), closed = [];
  b.nodes.get("paymentModal").style.display = "flex"; b.nodes.get("restockModal").style.display = "flex";
  b.context.closePaymentModal = () => closed.push("payment"); b.context.closeRestockModal = () => closed.push("restock");
  b.events.find(event => event.name === "keydown").callback({ key: "Escape" });
  assert.deepEqual(closed, ["payment"]);
});
