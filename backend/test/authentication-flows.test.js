const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const AuditLog = require("../models/auditLog");
const emailService = require("../services/emailService");
const { hashToken, createExpiringToken } = require("../services/authSecurityService");
const router = require("../routes/authRoutes");

function handler(path) {
  const route = router.stack.find(layer => layer.route?.path === path);
  assert.ok(route, `Route missing: ${path}`);
  return route.route.stack.at(-1).handle;
}

function setup(t, user = null) {
  const queries = [], created = [], emails = [], audit = [];
  t.mock.method(User, "findOne", async query => { queries.push(query); return user; });
  t.mock.method(User, "create", async data => { created.push(data); return data; });
  t.mock.method(bcrypt, "hash", async (password, rounds) => {
    assert.equal(rounds, 10);
    return `hashed:${password}`;
  });
  t.mock.method(bcrypt, "compare", async () => true);
  t.mock.method(emailService, "sendVerificationEmail", async data => { emails.push(data); return true; });
  t.mock.method(emailService, "sendResetEmail", async data => { emails.push(data); return true; });
  t.mock.method(AuditLog, "create", async data => audit.push(data));
  t.mock.method(console, "error", () => {});
  const req = {
    body: { email: " TEST@EXAMPLE.COM ", password: "long-password-123" },
    params: { token: "link-token" }, protocol: "http", get: () => "localhost:3000"
  };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    redirect(url) { this.location = url; return this; }
  };
  return { req, res, queries, created, emails, audit };
}

function account() {
  return { _id: "owner", password: "stored-hash", isVerified: true, saved: 0, async save() { this.saved++; } };
}

test("token creation uses distinct 32-byte tokens, hashed storage and a one-hour expiry", () => {
  const before = Date.now();
  const first = createExpiringToken();
  const second = createExpiringToken();
  assert.match(first.token, /^[a-f0-9]{64}$/);
  assert.notEqual(first.token, second.token);
  assert.equal(first.hash, hashToken(first.token));
  assert.notEqual(first.hash, first.token);
  assert.ok(first.expiresAt.getTime() >= before + 3600000);
  assert.ok(first.expiresAt.getTime() <= Date.now() + 3600000);
});

test("registration normalizes email, stores only the token hash and sends the verification link", async t => {
  const s = setup(t);
  await handler("/register")(s.req, s.res);
  assert.equal(s.res.statusCode, 200);
  assert.equal(s.res.body.verificationEmailSent, true);
  assert.deepEqual(s.queries, [{ email: "test@example.com" }]);
  const user = s.created[0];
  const token = s.emails[0].verificationLink.split("/").at(-1);
  assert.equal(user.password, "hashed:long-password-123");
  assert.equal(user.verifyTokenHash, hashToken(token));
  assert.equal(user.isVerified, false);
  assert.equal(s.emails[0].to, "test@example.com");
  assert.equal(s.emails[0].verificationLink, `http://localhost:3000/api/auth/verify-email/${token}`);
  assert.equal(JSON.stringify(s.res.body).includes(token), false);
  assert.equal(Object.values(user).includes(token), false);
});

test("registration rejects an existing account without creating another", async t => {
  const s = setup(t, account());
  await handler("/register")(s.req, s.res);
  assert.equal(s.res.statusCode, 400);
  assert.equal(s.created.length, 0);
  assert.equal(s.emails.length, 0);
});

test("registration keeps the created account when email delivery fails", async t => {
  const s = setup(t);
  t.mock.method(emailService, "sendVerificationEmail", async () => false);
  await handler("/register")(s.req, s.res);
  assert.equal(s.created.length, 1);
  assert.equal(s.res.body.success, true);
  assert.equal(s.res.body.verificationEmailSent, false);
});

for (const [path, body] of [
  ["/register", { email: "test@example.com", password: "short" }],
  ["/login", { email: 42, password: "password" }],
  ["/request-reset", { email: " " }],
  ["/reset-password/:token", { password: "short" }],
  ["/resend-verification", { email: null }]
]) {
  test(`${path} rejects invalid input before querying the database`, async t => {
    const s = setup(t);
    s.req.body = body;
    await handler(path)(s.req, s.res);
    assert.equal(s.res.statusCode, 400);
    assert.equal(s.queries.length, 0);
    assert.equal(s.emails.length, 0);
  });
}

for (const [label, user, validPassword, status] of [
  ["missing account", null, true, 400],
  ["incorrect password", account(), false, 400],
  ["suspended account", { ...account(), isSuspended: true }, true, 403],
  ["unverified account", { ...account(), isVerified: false }, true, 403]
]) {
  test(`login rejects ${label} without issuing a session`, async t => {
    const s = setup(t, user);
    t.mock.method(bcrypt, "compare", async () => validPassword);
    const sign = t.mock.method(jwt, "sign", () => { throw new Error("Must not issue a token"); });
    await handler("/login")(s.req, s.res);
    assert.equal(s.res.statusCode, status);
    assert.equal(sign.mock.callCount(), 0);
    assert.equal(s.audit.length, 0);
  });
}

test("login issues a seven-day user session and records the audit event", async t => {
  const s = setup(t, account());
  t.mock.method(jwt, "sign", (payload, secret, options) => {
    assert.deepEqual(payload, { userId: "owner" });
    assert.equal(secret, process.env.JWT_SECRET);
    assert.deepEqual(options, { expiresIn: "7d" });
    return "session-token";
  });
  await handler("/login")(s.req, s.res);
  assert.deepEqual(s.res.body, { success: true, token: "session-token" });
  assert.deepEqual(s.queries, [{ email: "test@example.com" }]);
  assert.equal(s.audit[0].userId, "owner");
  assert.equal(s.audit[0].action, "user.login");
});

for (const [path, linkField, hashField, expiryField] of [
  ["/request-reset", "resetLink", "resetTokenHash", "resetTokenExpiresAt"],
  ["/resend-verification", "verificationLink", "verifyTokenHash", "verifyTokenExpiresAt"]
]) {
  test(`${path} saves a hashed token before sending its link`, async t => {
    const user = { ...account(), isVerified: false };
    const s = setup(t, user);
    const before = Date.now();
    const send = async data => { assert.equal(user.saved, 1); s.emails.push(data); return true; };
    t.mock.method(emailService, path === "/request-reset" ? "sendResetEmail" : "sendVerificationEmail", send);
    await handler(path)(s.req, s.res);
    const token = s.emails[0][linkField].split("/").at(-1);
    assert.equal(user[hashField], hashToken(token));
    assert.notEqual(user[hashField], token);
    assert.ok(user[expiryField].getTime() >= before + 3600000);
    assert.equal(s.res.body.success, true);
    assert.equal(JSON.stringify(s.res.body).includes(token), false);
  });

  test(`${path} reports email delivery failure`, async t => {
    const s = setup(t, { ...account(), isVerified: false });
    t.mock.method(emailService, path === "/request-reset" ? "sendResetEmail" : "sendVerificationEmail", async () => false);
    await handler(path)(s.req, s.res);
    assert.equal(s.res.statusCode, 503);
  });
}

test("password reset consumes the token after checking its hash and expiry", async t => {
  const user = account();
  const s = setup(t, user);
  await handler("/reset-password/:token")(s.req, s.res);
  assert.equal(s.queries[0].resetTokenHash, hashToken("link-token"));
  assert.ok(s.queries[0].resetTokenExpiresAt.$gt instanceof Date);
  assert.equal(user.password, "hashed:long-password-123");
  assert.equal(user.resetTokenHash, null);
  assert.equal(user.resetTokenExpiresAt, null);
  assert.equal(user.saved, 1);
  assert.equal(s.res.body.success, true);
});

test("password reset rejects an expired or unknown token", async t => {
  const s = setup(t);
  await handler("/reset-password/:token")(s.req, s.res);
  assert.equal(s.res.statusCode, 400);
  assert.equal(s.res.body.error, "Token invalide");
});

test("verification consumes its token and redirects to success", async t => {
  const user = { ...account(), isVerified: false };
  const s = setup(t, user);
  await handler("/verify-email/:token")(s.req, s.res);
  assert.equal(s.queries[0].verifyTokenHash, hashToken("link-token"));
  assert.ok(s.queries[0].verifyTokenExpiresAt.$gt instanceof Date);
  assert.equal(user.isVerified, true);
  assert.equal(user.verifyTokenHash, null);
  assert.equal(user.verifyTokenExpiresAt, null);
  assert.equal(user.saved, 1);
  assert.equal(s.res.location, "http://localhost:3000/verify-email-success");
});

for (const user of [null, account()]) {
  test(`verification handles ${user ? "already verified" : "unknown or expired"} accounts`, async t => {
    const s = setup(t, user);
    await handler("/verify-email/:token")(s.req, s.res);
    assert.equal(s.res.location, "http://localhost:3000/verify-email-already");
    await handler("/resend-verification")(s.req, s.res);
    assert.deepEqual(s.res.body, { success: true });
    assert.equal(s.emails.length, 0);
  });
}

test("database failure keeps the verification error redirect", async t => {
  const s = setup(t);
  t.mock.method(User, "findOne", async () => { throw new Error("Database unavailable"); });
  await handler("/verify-email/:token")(s.req, s.res);
  assert.equal(s.res.location, "http://localhost:3000/verify-email-error");
});

test("account routes retain authentication and sensitive-operation rate limits", () => {
  const auth = require("../middleware/auth");
  for (const path of ["/export-data", "/activity", "/change-password", "/delete-account"]) {
    const route = router.stack.find(layer => layer.route?.path === path).route;
    assert.equal(route.stack[0].handle, auth);
    assert.equal(route.stack.length, ["/change-password", "/delete-account"].includes(path) ? 3 : 2);
  }
});
