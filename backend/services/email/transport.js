const nodemailer = require("nodemailer");

const smtpPort = Number(process.env.SMTP_PORT || 465);
const isSmtpConfigured = Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASSWORD &&
  process.env.EMAIL_FROM
);

const smtpTransport = isSmtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: process.env.SMTP_SECURE
        ? process.env.SMTP_SECURE === "true"
        : smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    })
  : null;

if (isSmtpConfigured) {
  console.log(`✅ SMTP configuré (${process.env.SMTP_HOST}:${smtpPort})`);
} else {
  console.warn("⚠️ SMTP non configuré : l'envoi e-mail est désactivé.");
}

async function sendEmail(message) {
  if (!smtpTransport) return false;

  await smtpTransport.sendMail({
    from: process.env.EMAIL_FROM,
    ...message
  });

  return true;
}

module.exports = { isSmtpConfigured, sendEmail };
