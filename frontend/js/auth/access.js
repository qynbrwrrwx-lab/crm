// auth/access.js: fonctions extraites sans changement de comportement.

function getAuthPasswordToggleIcon(showPassword) {
  if (showPassword) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 3 18 18"></path><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path><path d="M9.4 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-3.2 4.4"></path><path d="M6.6 6.6C3.7 8.6 2 12 2 12s3.5 8 10 8a9.9 9.9 0 0 0 3.4-.6"></path></svg>';
  }
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
}

function toggleAuthPassword() {
  const input = document.getElementById("password");
  const button = document.querySelector(".auth-password-toggle");
  if (!input || !button) return;
  const showPassword = input.type === "password";
  input.type = showPassword ? "text" : "password";
  button.setAttribute("aria-label", showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe");
  button.setAttribute("title", showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe");
  button.innerHTML = getAuthPasswordToggleIcon(showPassword);
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
