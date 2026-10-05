const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildAccountActionEmail,
  buildDocumentEmailHtml,
  personalizeEmailText
} = require("../services/email/templates");

test("document email escapes document and quote values before rendering HTML", () => {
  const html = buildDocumentEmailHtml({
    title: "🧾 Nouvelle facture",
    intro: "Bonjour <Client>",
    closing: "Merci & à bientôt",
    documentNumber: '<img src=x onerror="alert(1)">',
    total: "10.00",
    paymentStatus: "pending",
    quoteLink: 'https://example.test/?x="<unsafe>"'
  });

  assert.match(html, /Bonjour &lt;Client&gt;/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(html, /https:\/\/example\.test\/\?x=&quot;&lt;unsafe&gt;&quot;/);
  assert.match(html, /Merci &amp; à bientôt/);
});

test("account action links and document template variables are safely rendered", () => {
  const accountHtml = buildAccountActionEmail({
    title: "Validation",
    message: "Confirmez votre compte.",
    actionLabel: "Valider",
    actionLink: 'https://example.test/?token="abc"'
  });
  const text = personalizeEmailText(
    "Bonjour {{client}}, {{document}} {{numero}} : {{total}}",
    { client: "Ada", document: "facture", numero: "F-1", total: "10 €" },
    ""
  );

  assert.match(accountHtml, /token=&quot;abc&quot;/);
  assert.equal(text, "Bonjour Ada, facture F-1 : 10 €");
});
