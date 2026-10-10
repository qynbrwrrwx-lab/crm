// Modèle de réinitialisation du mot de passe.

function renderPasswordResetPage() {
  return `
    <main class="account-assistance-page">
      <section class="account-assistance-card">
        <img class="account-assistance-logo" src="/logo.png" alt="My Prospect">
        <p class="account-assistance-copy">Sécurisez votre compte avec un nouveau mot de passe.</p>
        <div class="account-assistance-field account-assistance-password-field">
          <input class="account-assistance-input" id="newPassword" type="password" placeholder="Nouveau mot de passe" autocomplete="new-password">
          <button class="account-assistance-password-toggle" type="button" onclick="togglePassword()" aria-label="Afficher ou masquer le mot de passe">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </button>
        </div>
        <div class="account-assistance-field">
          <input class="account-assistance-input" id="confirmNewPassword" type="password" placeholder="Confirmer le nouveau mot de passe" autocomplete="new-password">
        </div>
        <button class="account-assistance-action" type="button" onclick="resetPassword()">Modifier le mot de passe</button>
      </section>
    </main>
  `;
}
