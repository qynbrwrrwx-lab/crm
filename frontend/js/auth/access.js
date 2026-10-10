// auth/access.js: fonctions extraites sans changement de comportement.

function toggleAuthPassword() {
  const input = document.getElementById("password");
  const button = document.querySelector(".auth-password-toggle");
  if (!input || !button) return;
  const showPassword = input.type === "password";
  input.type = showPassword ? "text" : "password";
  button.setAttribute("aria-label", showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe");
  button.setAttribute("title", showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe");
  button.innerHTML = `<i data-lucide="${showPassword ? "eye-off" : "eye"}"></i>`;
  window.lucide?.createIcons();
}

function setAuthBusy(isBusy) {
  ["loginSubmitButton", "registerButton"].forEach(id => {
    const button = document.getElementById(id);
    if (button) {
      button.disabled = isBusy;
      button.setAttribute?.("aria-busy", String(isBusy));
    }
  });
}

function readAuthCredentials(emailId = "email", passwordId = "password") {
  return {
    email: document.getElementById(emailId).value,
    password: document.getElementById(passwordId).value
  };
}

function sendAuthCredentials(endpoint, credentials) {
  return apiFetch(endpoint, { method: "POST", body: JSON.stringify(credentials) });
}

async function register() {
  const credentials = readAuthCredentials();

  if (credentials.password.length < 12) {
    showToast("Le mot de passe doit contenir au moins 12 caracteres");
    return;
  }

  setAuthBusy(true);
  showLoader();

  try {
    const data = await sendAuthCredentials("/api/auth/register", credentials);

    showToast(data.message || "📩 Vérifie ton email !");

  } catch (err) {

    showToast(err.message);
  } finally {
    hideLoader();
    setAuthBusy(false);
  }
}

async function login() {
  const credentials = readAuthCredentials();

  setAuthBusy(true);
  showLoader();

  try {
    const data = await sendAuthCredentials("/api/auth/login", credentials);
    setToken(data.token);

    showApp();

    showToast("Bienvenue 🚀");

  } catch (err) {

    showToast(err.message);
  } finally {
    hideLoader();
    setAuthBusy(false);
  }
}

function initializeAuthAccess() {
  const form = document.getElementById("authForm");
  form?.addEventListener?.("submit", event => {
    event.preventDefault();
    return login();
  });
  document.getElementById("registerButton")?.addEventListener?.("click", register);
  document.getElementById("authPasswordToggle")?.addEventListener?.("click", toggleAuthPassword);
}

if (document.readyState === "loading") {
  document.addEventListener?.("DOMContentLoaded", initializeAuthAccess, { once: true });
} else {
  initializeAuthAccess();
}

async function adminLogin() {
  const credentials = readAuthCredentials("adminEmail", "adminPassword");

  try {
    const data = await sendAuthCredentials("/api/auth/login", credentials);
    setToken(data.token);
    window.location.href = "/admin";
  } catch (err) {
    alert(err.message);
  }
}

function logoutAdmin() {
  removeToken();
  window.location.href = "/admin-login";
  }
