const { sendEmail } = require("./transport");
const { buildAccountActionEmail } = require("./templates");

async function sendAccountActionEmail({ to, link, type }) {
  const isReset = type === "reset";
  const subject = isReset ? "Réinitialisation du mot de passe" : "Validation de votre compte";
  const html = buildAccountActionEmail({
    title: isReset ? "🔐 Réinitialisation du mot de passe" : "✅ Validation du compte",
    message: isReset
      ? "Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe."
      : "Cliquez ci-dessous pour confirmer votre adresse email.",
    actionLabel: isReset ? "Réinitialiser" : "Valider mon compte",
    actionLink: link
  });

  try {
    const sent = await sendEmail({ to, subject, html });

    if (!sent) return false;

    console.log(isReset ? `✅ Reset envoyé à ${to}` : `✅ Verification envoyée à ${to}`);
    return true;
  } catch (err) {
    console.error(isReset ? "❌ RESET EMAIL ERROR :" : "❌ VERIFICATION EMAIL ERROR :", err);
    return false;
  }
}

function sendResetEmail({ to, resetLink }) {
  return sendAccountActionEmail({ to, link: resetLink, type: "reset" });
}

function sendVerificationEmail({ to, verificationLink }) {
  return sendAccountActionEmail({ to, link: verificationLink, type: "verification" });
}

module.exports = { sendResetEmail, sendVerificationEmail };
