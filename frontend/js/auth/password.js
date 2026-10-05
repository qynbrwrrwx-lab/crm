// auth/password.js: fonctions extraites sans changement de comportement.

async function resetPassword() {

  const password =
    document.getElementById("newPassword").value;

  const confirmation =
    document.getElementById("confirmNewPassword")?.value;

  if (password.length < 12) {
    showToast("Le mot de passe doit contenir au moins 12 caracteres");
    return;
  }

  if (password !== confirmation) {
    showToast("Les deux mots de passe ne correspondent pas");
    document.getElementById("confirmNewPassword")?.focus();
    return;
  }

  const token =
    window.location.pathname.split("/").pop();

  try {

    const res = await fetch(

  `${API_URL}/api/auth/reset-password/${token}`,

  {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      password
    })
  }
);

    const data = await res.json();

    if (!res.ok) {

      alert(data.error || "Erreur");

      return;
    }

    alert("Mot de passe modifié ✅");

    window.location.href = "/";

  } catch (err) {

    console.error(err);

    alert("Erreur serveur");
  }
}

function changePassword() {
  const modal = document.getElementById("passwordChangeModal");
  const currentPassword = document.getElementById("currentPasswordInput");
  const newPassword = document.getElementById("newPasswordInput");
  const confirmation = document.getElementById("confirmNewPasswordInput");
  if (!modal || !currentPassword || !newPassword || !confirmation) return;
  currentPassword.value = "";
  newPassword.value = "";
  confirmation.value = "";
  updatePasswordStrength();
  modal.style.display = "flex";
  window.setTimeout(() => currentPassword.focus(), 40);
}

function closePasswordChangeModal() {
  const modal = document.getElementById("passwordChangeModal");
  if (modal) modal.style.display = "none";
  ["currentPasswordInput", "newPasswordInput", "confirmNewPasswordInput"].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.value = "";
      input.type = "password";
    }
  });
  document.querySelectorAll(".password-input-wrap button").forEach(button => { button.textContent = "Afficher"; });
  updatePasswordStrength();
}

function updatePasswordStrength() {
  const input = document.getElementById("newPasswordInput");
  const indicator = document.getElementById("passwordStrength");
  if (!input || !indicator) return;

  const value = input.value;
  const checks = [value.length >= 12, /[a-z]/.test(value), /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)];
  const score = checks.filter(Boolean).length;
  const levels = ["neutral", "weak", "medium", "strong", "strong", "strong"];
  const labels = ["Utilisez au moins 12 caractères", "Faible", "À renforcer", "Correct", "Solide", "Très solide"];

  indicator.className = `password-strength ${levels[score]}`;
  indicator.querySelector("b").textContent = labels[score];
}

function togglePasswordField(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input || !button) return;
  const visible = input.type === "text";
  input.type = visible ? "password" : "text";
  button.textContent = visible ? "Afficher" : "Masquer";
}

async function submitPasswordChange(event) {
  event.preventDefault();
  const currentPassword = document.getElementById("currentPasswordInput")?.value;
  const newPassword = document.getElementById("newPasswordInput")?.value;
  const confirmation = document.getElementById("confirmNewPasswordInput")?.value;
  if (!currentPassword || !newPassword || !confirmation) return;
  if (newPassword !== confirmation) {
    showToast("Les deux nouveaux mots de passe ne correspondent pas");
    document.getElementById("confirmNewPasswordInput")?.focus();
    return;
  }

  try {
    await apiFetch("/api/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword })
    });
    closePasswordChangeModal();
    showToast("Mot de passe modifié ✅");
    loadAccountActivity();
  } catch (err) {
    showToast(err.message || "Impossible de modifier le mot de passe");
  }
}
