const { sendEmail } = require("./email/transport");
const { sendInvoiceEmail } = require("./email/document-mailer");
const { sendResetEmail, sendVerificationEmail } = require("./email/account-mailer");

module.exports = {
  sendEmail,
  sendInvoiceEmail,
  sendResetEmail,
  sendVerificationEmail
};
