const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const frontend = path.resolve(__dirname, "../../frontend");
const html = fs.readFileSync(path.join(frontend, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script\s+src="([^"]+)"[^>]*>/g)].map(match => match[1]);
const authScripts = scripts.filter(src => ["/js/auth.js", "/js/auth-pages.js", "/js/core/csv.js", "/js/invoices/export.js"].includes(src) || src.startsWith("/js/auth/"));

function browser(pathname = "/") {
  const elements = new Map(), storage = new Map(), calls = [], toasts = [];
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) {
    elements.set(match[1], { value: "", type: "password", style: {}, textContent: "", innerHTML: "", focus() {}, querySelector() { return { textContent: "" }; } });
  }
  for (const id of ["newPassword", "confirmNewPassword"]) elements.set(id, { value: "", type: "password", focus() {} });
  let shown = 0, loading = false;
  const context = vm.createContext({
    document: { body: { innerHTML: "original-page" }, documentElement: { classList: { remove() {} } }, getElementById: id => elements.get(id) || null, querySelectorAll: () => [], querySelector: () => null },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) },
    location: { pathname, href: "", reload() {} }, console: { error() {} },
    apiFetch: async (...args) => { calls.push(args); throw new Error("Unexpected API call"); },
    fetch: async (...args) => { calls.push(args); throw new Error("Unexpected fetch"); },
    showToast: message => toasts.push(message), alert: message => toasts.push(message),
    showLoader: () => { loading = true; }, hideLoader: () => { loading = false; },
    showApp: () => shown++, confirmAppAction: async () => false, setTimeout() {}, API_URL: "https://test.invalid", map: null
  });
  context.window = context;
  for (const src of ["/js/core/text.js", "/js/core/formatters.js", ...authScripts]) {
    vm.runInContext(fs.readFileSync(path.join(frontend, src), "utf8"), context, { filename: src, timeout: 1000 });
  }
  return { context, elements, storage, calls, toasts, shown: () => shown, loading: () => loading };
}

test("authentication modules load once and page templates precede the page selector", () => {
  assert.equal(authScripts.length, new Set(authScripts).size);
  const files = fs.readdirSync(path.join(frontend, "js/auth")).filter(name => name.endsWith(".js"));
  assert.deepEqual(authScripts.filter(src => src.startsWith("/js/auth/")).map(src => path.basename(src)).sort(), files.sort());
  for (const name of files) assert.ok(scripts.indexOf(`/js/auth/${name}`) < scripts.indexOf("/js/auth-pages.js"));
  const b = browser();
  assert.equal(b.context.document.body.innerHTML, "original-page");
  assert.equal(b.calls.length, 0);
});

test("session helpers store and remove the existing token key", () => {
  const b = browser();
  assert.equal(b.context.getToken(), null);
  b.context.setToken("test-session");
  assert.equal(b.storage.get("token"), "test-session");
  assert.equal(b.context.getToken(), "test-session");
  b.context.removeToken();
  assert.equal(b.context.getToken(), null);
});

test("login stores its session and opens the application", async () => {
  const b = browser();
  b.elements.get("email").value = "client@example.com";
  b.elements.get("password").value = "test-password";
  b.context.apiFetch = async (url, options) => {
    assert.equal(url, "/api/auth/login");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), { email: "client@example.com", password: "test-password" });
    return { token: "test-session" };
  };
  await b.context.login();
  assert.equal(b.storage.get("token"), "test-session");
  assert.equal(b.shown(), 1);
  assert.equal(b.loading(), false);
  assert.equal(b.elements.get("loginSubmitButton").disabled, false);
  assert.equal(b.elements.get("registerButton").disabled, false);
});

test("failed login leaves the application closed and clears its loader", async () => {
  const b = browser();
  b.context.apiFetch = async () => { throw new Error("Invalid login"); };
  await b.context.login();
  assert.equal(b.storage.has("token"), false);
  assert.equal(b.shown(), 0);
  assert.equal(b.loading(), false);
  assert.equal(b.toasts.at(-1), "Invalid login");
});

test("registration rejects a short password without a request", async () => {
  const b = browser();
  b.elements.get("password").value = "short";
  await b.context.register();
  assert.equal(b.calls.length, 0);
  assert.match(b.toasts.at(-1), /12 caracteres/);
});

test("logout clears session and navigation and hides the application", () => {
  const b = browser();
  b.storage.set("token", "test-session");
  b.storage.set("my-prospect-active-section", "contacts");
  let removed = false;
  b.context.map = { remove() { removed = true; } };
  b.context.logout();
  assert.equal(b.storage.size, 0);
  assert.equal(b.elements.get("app").style.display, "none");
  assert.equal(b.elements.get("auth").style.display, "flex");
  assert.equal(removed, true);
  assert.equal(b.context.map, null);
});

for (const pathname of ["/reset-password/private-token", "/verify-email/private-token", "/verify-email-success", "/verify-email-already", "/verify-email-error"]) {
  test(`assistance page ${pathname} renders without requests or exposing its token`, () => {
    const b = browser(pathname);
    assert.notEqual(b.context.document.body.innerHTML, "original-page");
    assert.match(b.context.document.body.innerHTML, /My Prospect|logo\.png/);
    assert.doesNotMatch(b.context.document.body.innerHTML, /private-token/);
    assert.equal(b.calls.length, 0);
  });
}

test("password reset validates confirmation then posts to the token route", async () => {
  const b = browser("/reset-password/private-token");
  b.elements.get("newPassword").value = "new-password-123";
  b.elements.get("confirmNewPassword").value = "mismatch";
  await b.context.resetPassword();
  assert.equal(b.calls.length, 0);
  assert.match(b.toasts.at(-1), /ne correspondent pas/);
  b.elements.get("confirmNewPassword").value = "new-password-123";
  let sent;
  b.context.fetch = async (url, options) => {
    sent = { url, method: options.method, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ success: true }) };
  };
  await b.context.resetPassword();
  assert.deepEqual(sent, { url: "https://test.invalid/api/auth/reset-password/private-token", method: "POST", body: { password: "new-password-123" } });
  assert.equal(b.context.location.href, "/");
});

test("cancelled account deletion makes no request and retains the session", async () => {
  const b = browser();
  b.storage.set("token", "session");
  await b.context.deleteAccount();
  assert.equal(b.calls.length, 0);
  assert.equal(b.storage.get("token"), "session");
});

test("shared CSV parser preserves escaped quotes, semicolons and multiline cells", () => {
  const b = browser();
  const csv = '\uFEFFNom;Notes\r\n"Martin";"Ligne 1; \"\"texte\"\"\nLigne 2"\r\n';
  const rows = b.context.parseCsvImport(csv);
  assert.equal(rows[0].nom, "Martin");
  assert.equal(rows[0].notes, 'Ligne 1; "texte"\nLigne 2');
  assert.equal(b.context.escapeCsvValue('A;"B"'), '"A;""B"""');
});

test("CSV import refuses oversized files before reading their content", async () => {
  const b = browser();
  let read = false;
  const event = { target: { value: "file.csv", files: [{ size: 2 * 1024 * 1024 + 1, text: async () => { read = true; return ""; } }] } };
  await assert.rejects(b.context.readCsvImport(event), /maximum 2 Mo/);
  assert.equal(read, false);
  assert.equal(event.target.value, "");
});

test("sales export includes invoices and credit notes while excluding quotes", async () => {
  const b = browser();
  b.context.apiFetch = async url => {
    assert.equal(url, "/api/invoices");
    return ["invoice", "credit_note", "quote"].map(type => ({ type, invoiceNumber: type, createdAt: "2026-01-01", totalHT: 100, totalTTC: 120, contactId: { companyName: "Client" } }));
  };
  let exported;
  b.context.downloadCsvFile = (lines, label) => { exported = { lines, label }; };
  await b.context.exportSalesCsv();
  assert.equal(exported.label, "ventes");
  assert.equal(exported.lines.length, 3);
  assert.equal(exported.lines[1][1], "Facture");
  assert.equal(exported.lines[2][1], "Avoir");
});
