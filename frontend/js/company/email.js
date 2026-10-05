// Entreprise : email.

function updateEmailSendingPreview() {
  const companyName = document.getElementById("companyName")?.value.trim() || "votre entreprise";
  const replyTo = document.getElementById("companyReplyToEmail")?.value.trim()
    || document.getElementById("companyEmail")?.value.trim()
    || "adresse de votre compte";
  const sender = document.getElementById("emailSenderPreview");
  const reply = document.getElementById("emailReplyPreview");
  if (sender) sender.textContent = `My Prospect — ${companyName}`;
  if (reply) reply.textContent = replyTo;
}

document.getElementById("companyReplyToEmail")?.addEventListener("input", updateEmailSendingPreview);

document.getElementById("companyEmail")?.addEventListener("input", updateEmailSendingPreview);

document.getElementById("companyName")?.addEventListener("input", updateEmailSendingPreview);
