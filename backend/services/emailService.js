const nodemailer = require("nodemailer");

// ================= TRANSPORTER =================

const transporter =
  nodemailer.createTransport({

    host: process.env.EMAIL_HOST,

    port: process.env.EMAIL_PORT,

    secure: false,

    auth: {

      user: process.env.EMAIL_USER,

      pass: process.env.EMAIL_PASS
    }
  });

// ================= SEND INVOICE EMAIL =================

async function sendInvoiceEmail({
  to,
  invoice,
  pdfBuffer
}) {

  try {

    const isQuote =
      invoice.type === "quote";

    await transporter.sendMail({

      from: process.env.EMAIL_FROM,

      to,

      subject:
        isQuote
          ? `Votre devis ${invoice.invoiceNumber}`
          : `Votre facture ${invoice.invoiceNumber}`,

      html: `

        <div style="
          font-family:Arial;
          padding:30px;
        ">

          <h2>
            ${
              isQuote
                ? "📄 Nouveau devis"
                : "🧾 Nouvelle facture"
            }
          </h2>

          <p>
            Bonjour,
          </p>

          <p>
            Veuillez trouver ci-joint votre
            ${
              isQuote
                ? "devis"
                : "facture"
            }.
          </p>

          <p>
            Numéro :
            <strong>
              ${invoice.invoiceNumber}
            </strong>
          </p>

          <p>
            Total TTC :
            <strong>
              ${invoice.totalTTC.toFixed(2)} €
            </strong>
          </p>

          <br>

          <p>
            Merci pour votre confiance 🙌
          </p>

        </div>
      `,

      attachments: [

        {
          filename:
            `${invoice.invoiceNumber}.pdf`,

          content: pdfBuffer
        }
      ]
    });

    console.log(
      "✅ Email envoyé avec succès"
    );

  } catch (err) {

    console.error(
      "❌ Erreur email:",
      err
    );
  }
}

module.exports =
  sendInvoiceEmail;