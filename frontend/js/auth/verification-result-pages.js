// Écrans dédiés aux trois états de validation e-mail.
function renderEmailVerificationSuccessPage() {
  return renderEmailVerificationResult({
    title: "✅ Email validé",
    message: "Votre adresse email a bien été confirmée.",
    actionLabel: "Accéder à l’application"
  });
}

function renderEmailVerificationAlreadyPage() {
  return renderEmailVerificationResult({
    title: "ℹ️ Email déjà validé",
    message: "Votre adresse email a déjà été confirmée.",
    actionLabel: "Accéder à l’application"
  });
}

function renderEmailVerificationErrorPage() {
  return renderEmailVerificationResult({
    title: "❌ Lien invalide",
    message: "Ce lien de validation est expiré ou invalide.",
    actionLabel: "Retour à l’application"
  });
}
