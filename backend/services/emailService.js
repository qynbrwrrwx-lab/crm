const sgMail = require("@sendgrid/mail");

// ================= SENDGRID CONFIG =================

sgMail.setApiKey(
  process.env.SENDGRID_API_KEY
);

console.log(
  "✅ SendGrid configuré"
);

// ================= SEND EMAIL =================

async function sendInvoiceEmail({
  to,
  invoice,
  pdfBuffer
}) {

  try {

    if (!to) {

      console.log(
        "⚠️ Aucun email client"
      );

      return;
    }

    const isQuote =
      invoice.type === "quote";

    const subject =
      isQuote
        ? `Votre devis ${invoice.invoiceNumber}`
        : `Votre facture ${invoice.invoiceNumber}`;

    const html = `

      <div style="
        font-family:Arial;
        padding:30px;
        background:#f8fafc;
      ">

        <div style="
          max-width:600px;
          margin:auto;
          background:white;
          padding:30px;
          border-radius:12px;
          border:1px solid #e2e8f0;
        ">

          <h1 style="
            color:#2563eb;
            margin-bottom:20px;
          ">

            ${
              isQuote
                ? "📄 Nouveau devis"
                : "🧾 Nouvelle facture"
            }

          </h1>

          <p style="
            font-size:15px;
            color:#334155;
          ">

            Bonjour,

          </p>

          <p style="
            font-size:15px;
            color:#334155;
            line-height:1.7;
          ">

            Veuillez trouver ci-joint votre
            ${
              isQuote
                ? "devis"
                : "facture"
            }.

          </p>

          <div style="
            margin-top:25px;
            padding:20px;
            background:#eff6ff;
            border-radius:10px;
          ">

            <p>
              <strong>
                Numéro :
              </strong>

              ${invoice.invoiceNumber}
            </p>

            <p>
              <strong>
                Total TTC :
              </strong>

              ${invoice.totalTTC.toFixed(2)} €
            </p>

            <p>
              <strong>
                Statut :
              </strong>

              ${
                invoice.paymentStatus === "paid"
                  ? "✅ Payé"
                  : "⌛ En attente"
              }
            </p>

          </div>

          <p style="
            margin-top:30px;
            color:#64748b;
            font-size:14px;
          ">

            Merci pour votre confiance 🙌

          </p>

          <hr style="
            margin-top:30px;
            border:none;
            border-top:1px solid #e2e8f0;
          ">

          <p style="
            font-size:12px;
            color:#94a3b8;
            margin-top:20px;
          ">

            My Prospect CRM

          </p>

        </div>

      </div>
    `;

    await sgMail.send({

      from: process.env.EMAIL_FROM,

      to,

      subject,

      html,

      attachments: [

        {
          filename:
            `${invoice.invoiceNumber}.pdf`,

          content: pdfBuffer,

          contentType:
            "application/pdf"
        }
      ]
    });

    console.log(
      `✅ Email envoyé à ${to}`
    );

  } catch (err) {

    console.error(
      "❌ EMAIL ERROR :",
      err
    );
  }
}

// ================= RESET EMAIL =================

async function sendResetEmail({
  to,
  resetLink
}) {

  try {

    await sgMail.send({

      from: process.env.EMAIL_FROM,

      to,

      subject:
        "Réinitialisation du mot de passe",

      html: `

        <div style="
          font-family:Arial;
          padding:30px;
        ">

          <h2>
            🔐 Réinitialisation du mot de passe
          </h2>

          <p>
            Cliquez sur le bouton ci-dessous
            pour réinitialiser votre mot de passe.
          </p>

          <a
            href="${resetLink}"
            style="
              display:inline-block;
              margin-top:20px;
              padding:12px 20px;
              background:#2563eb;
              color:white;
              text-decoration:none;
              border-radius:8px;
            "
          >
            Réinitialiser
          </a>

        </div>
      `
    });

    console.log(
      `✅ Reset envoyé à ${to}`
    );

  } catch (err) {

    console.error(
      "❌ RESET EMAIL ERROR :",
      err
    );
  }
}

// ================= VERIFICATION EMAIL =================

async function sendVerificationEmail({
  to,
  verificationLink
}) {

  try {

    await sgMail.send({

      from: process.env.EMAIL_FROM,

      to,

      subject:
        "Validation de votre compte",

      html: `

        <div style="
          font-family:Arial;
          padding:30px;
        ">

          <h2>
            ✅ Validation du compte
          </h2>

          <p>
            Cliquez ci-dessous pour
            confirmer votre adresse email.
          </p>

          <a
            href="${verificationLink}"
            style="
              display:inline-block;
              margin-top:20px;
              padding:12px 20px;
              background:#2563eb;
              color:white;
              text-decoration:none;
              border-radius:8px;
            "
          >
            Valider mon compte
          </a>

        </div>
      `
    });

    console.log(
      `✅ Verification envoyée à ${to}`
    );

  } catch (err) {

    console.error(
      "❌ VERIFICATION EMAIL ERROR :",
      err
    );
  }
}

// ================= EXPORTS =================

module.exports = {

  sendInvoiceEmail,

  sendResetEmail,

  sendVerificationEmail
};