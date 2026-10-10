// Gabarit partagé par les écrans de résultat de vérification e-mail.

function renderEmailVerificationResult({ title, message, actionLabel }) {
  return `
    <main class="account-assistance-page">
      <section class="account-assistance-card">
        <img class="account-assistance-logo" src="/logo.png" alt="My Prospect">
        <h1 class="account-assistance-title">${title}</h1>
        <p class="account-assistance-copy">${message}</p>
        <a class="account-assistance-action" href="/login">${actionLabel}</a>
      </section>
    </main>
  `;
}
