// Écran confirmé après validation de l’adresse e-mail.

function renderEmailVerificationPendingPage() {
  return `
    <main class="account-assistance-page">
      <section class="account-assistance-card">
        <img class="account-assistance-logo" src="/logo.png" alt="My Prospect">
        <h1 class="account-assistance-title">✅ Email validé</h1>
        <p class="account-assistance-copy">Votre adresse email a bien été confirmée.</p>
        <a class="account-assistance-action" href="/login">Accéder à l’application</a>
      </section>
    </main>
  `;
}
