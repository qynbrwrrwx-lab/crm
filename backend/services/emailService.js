const nodemailer = require("nodemailer");

// ================= TRANSPORTER =================

const transporter =
  nodemailer.createTransport({

    host: process.env.EMAIL_HOST,

    port: Number(process.env.EMAIL_PORT),

    secure:
      Number(process.env.EMAIL_PORT) === 465,

    auth: {

      user: process.env.EMAIL_USER,

      pass: process.env.EMAIL_PASS
    }
  });

// ================= VERIFY SMTP =================

transporter.verify((err) => {

  if (err) {

    console.error(
      "❌ SMTP ERROR :",
      err.message
    );

  } else {

    console.log(
      "✅ SMTP connecté"
    );
  }
});

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

    await transporter.sendMail({

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

module.exports =
  sendInvoiceEmail;