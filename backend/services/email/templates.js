function escapeEmailHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function personalizeEmailText(template, values, fallback) {
  const text = String(template || fallback).slice(0, 800);

  return text.replace(/\{\{(client|document|numero|total)\}\}/g, (match, key) => values[key] || match);
}

function buildDocumentEmailHtml({ title, intro, closing, documentNumber, total, paymentStatus, quoteLink }) {
  const quoteAction = quoteLink
    ? `<p style="margin:24px 0"><a href="${escapeEmailHtml(quoteLink)}" style="display:inline-block;padding:13px 18px;border-radius:8px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700">Consulter et accepter le devis</a></p><p style="font-size:12px;color:#64748b">Ce lien sécurisé est valable pendant la durée de validité du devis.</p>`
    : "";
  const status = paymentStatus === "paid" ? "✅ Payé" : "⌛ En attente";

  return `
    <div style="font-family:Arial;padding:30px;background:#f8fafc">
      <div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:12px;border:1px solid #e2e8f0">
        <h1 style="color:#2563eb;margin-bottom:20px">${title}</h1>
        <p style="font-size:15px;color:#334155">${escapeEmailHtml(intro).replace(/\n/g, "<br>")}</p>
        ${quoteAction}
        <div style="margin-top:25px;padding:20px;background:#eff6ff;border-radius:10px">
          <p><strong>Numéro :</strong> ${escapeEmailHtml(documentNumber)}</p>
          <p><strong>Total TTC :</strong> ${escapeEmailHtml(total)} €</p>
          <p><strong>Statut :</strong> ${status}</p>
        </div>
        <p style="margin-top:30px;color:#64748b;font-size:14px">${escapeEmailHtml(closing).replace(/\n/g, "<br>")}</p>
        <hr style="margin-top:30px;border:none;border-top:1px solid #e2e8f0">
        <p style="font-size:12px;color:#94a3b8;margin-top:20px">My Prospect CRM</p>
      </div>
    </div>
  `;
}

function buildAccountActionEmail({ title, message, actionLabel, actionLink }) {
  return `
    <div style="font-family:Arial;padding:30px">
      <h2>${title}</h2>
      <p>${message}</p>
      <a href="${escapeEmailHtml(actionLink)}" style="display:inline-block;margin-top:20px;padding:12px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:8px">${actionLabel}</a>
    </div>
  `;
}

module.exports = {
  buildAccountActionEmail,
  buildDocumentEmailHtml,
  escapeEmailHtml,
  personalizeEmailText
};
