const passwordForm = document.getElementById("passwordForm");
const passwordInput = document.getElementById("password");
const confirmationInput = document.getElementById("confirmation");
const matchStatus = document.getElementById("matchStatus");
const resetStatus = document.getElementById("status");
const resetSubmitButton = document.getElementById("submitButton");
const resetToken = window.location.pathname.split("/").pop();

function updatePasswordMatch() {
  matchStatus.textContent = "";
  matchStatus.className = "password-match";
  if (!confirmationInput.value) return;

  if (passwordInput.value === confirmationInput.value) {
    matchStatus.textContent = "Les deux mots de passe correspondent.";
    matchStatus.classList.add("success");
    return;
  }

  matchStatus.textContent = "Les deux mots de passe ne correspondent pas.";
}

function setResetSubmitState(isSubmitting) {
  resetSubmitButton.disabled = isSubmitting;
  resetSubmitButton.querySelector("span").textContent = isSubmitting
    ? "Enregistrement en cours…"
    : "Enregistrer le mot de passe";
}

async function submitPasswordReset(event) {
  event.preventDefault();
  if (!passwordInput.checkValidity() || !confirmationInput.checkValidity()) {
    passwordForm.reportValidity();
    return;
  }

  if (passwordInput.value !== confirmationInput.value) {
    updatePasswordMatch();
    confirmationInput.focus();
    return;
  }

  resetStatus.textContent = "";
  resetStatus.className = "status";
  setResetSubmitState(true);

  try {
    const response = await fetch(`/api/auth/reset-password/${encodeURIComponent(resetToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passwordInput.value })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Impossible de modifier le mot de passe.");

    resetStatus.textContent = "Mot de passe modifié. Redirection vers la connexion…";
    resetStatus.classList.add("success");
    setTimeout(() => window.location.assign("/"), 1200);
  } catch (error) {
    resetStatus.textContent = error.message;
  } finally {
    setResetSubmitState(false);
  }
}

passwordInput.addEventListener("input", updatePasswordMatch);
confirmationInput.addEventListener("input", updatePasswordMatch);
passwordForm.addEventListener("submit", submitPasswordReset);
