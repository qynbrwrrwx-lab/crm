// app : confirmation.

function confirmAppAction({ title = "Confirmer l’action", message = "Êtes-vous sûr de vouloir continuer ?", actionLabel = "Confirmer", danger = false, passwordRequired = false } = {}) {
  const modal = document.getElementById("appConfirmModal");
  const titleElement = document.getElementById("appConfirmTitle");
  const messageElement = document.getElementById("appConfirmMessage");
  const submit = document.getElementById("appConfirmSubmit");
  const tone = document.getElementById("appConfirmTone");
  const passwordField = document.getElementById("appConfirmPasswordField");
  const passwordInput = document.getElementById("appConfirmPassword");
  if (!modal || !titleElement || !messageElement || !submit || !tone || !passwordField || !passwordInput) return Promise.resolve(false);

  titleElement.textContent = title;
  messageElement.textContent = message;
  submit.textContent = actionLabel;
  submit.classList.toggle("danger-btn", danger);
  tone.classList.toggle("is-danger", danger);
  tone.textContent = danger ? "!" : "✓";
  appConfirmationRequiresPassword = passwordRequired;
  passwordField.style.display = passwordRequired ? "grid" : "none";
  passwordInput.value = "";
  modal.style.display = "flex";
  return new Promise(resolve => {
    appConfirmationResolver = resolve;
    window.setTimeout(() => (passwordRequired ? passwordInput : submit).focus(), 40);
  });
}

function closeAppConfirmation(confirmed) {
  const modal = document.getElementById("appConfirmModal");
  const passwordInput = document.getElementById("appConfirmPassword");
  const password = passwordInput?.value || "";
  if (confirmed && appConfirmationRequiresPassword && !password) {
    showToast("Saisissez votre mot de passe pour continuer");
    passwordInput?.focus();
    return;
  }
  if (modal) modal.style.display = "none";
  const resolve = appConfirmationResolver;
  appConfirmationResolver = null;
  const value = confirmed && appConfirmationRequiresPassword ? password : Boolean(confirmed);
  appConfirmationRequiresPassword = false;
  if (resolve) resolve(value);
}
