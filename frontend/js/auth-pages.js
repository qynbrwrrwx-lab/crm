// Sélection des pages d’assistance. Charger après les modèles auth/.
const path = window.location.pathname;

if (path.includes("/reset-password/")) {
  document.body.innerHTML = renderPasswordResetPage();
}

if (path.includes("/verify-email/")) {
  document.body.innerHTML = renderEmailVerificationPendingPage();
}

if (path.includes("/verify-email-success")) {
  document.body.innerHTML = renderEmailVerificationSuccessPage();
}

if (path.includes("/verify-email-already")) {
  document.body.innerHTML = renderEmailVerificationAlreadyPage();
}

if (path.includes("/verify-email-error")) {
  document.body.innerHTML = renderEmailVerificationErrorPage();
}

function togglePassword() {

  const input =
    document.getElementById("newPassword");

  input.type =
    input.type === "password"
      ? "text"
      : "password";
}
