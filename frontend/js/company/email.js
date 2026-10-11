// Entreprise : email.

function getEmailSendingPresentation({ companyName, replyToEmail, companyEmail }) {
  const senderName = String(companyName || "").trim() || "votre entreprise";
  const replyTo = String(replyToEmail || "").trim()
    || String(companyEmail || "").trim()
    || "adresse de votre compte";
  return { senderLabel: `My Prospect — ${senderName}`, replyTo };
}

function updateEmailSendingPreview() {
  const presentation = getEmailSendingPresentation({
    companyName: document.getElementById("companyName")?.value,
    replyToEmail: document.getElementById("companyReplyToEmail")?.value,
    companyEmail: document.getElementById("companyEmail")?.value
  });
  const sender = document.getElementById("emailSenderPreview");
  const reply = document.getElementById("emailReplyPreview");
  if (sender) sender.textContent = presentation.senderLabel;
  if (reply) reply.textContent = presentation.replyTo;
}

document.getElementById("companyReplyToEmail")?.addEventListener("input", updateEmailSendingPreview);

document.getElementById("companyEmail")?.addEventListener("input", updateEmailSendingPreview);

document.getElementById("companyName")?.addEventListener("input", updateEmailSendingPreview);
