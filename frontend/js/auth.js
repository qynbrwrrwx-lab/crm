// auth.js: fonctions extraites sans changement de comportement.

function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function removeToken() {
  localStorage.removeItem("token");
}

function logout() {

  removeToken();
  document.documentElement.classList.remove("session-restoring");

  try {
    localStorage.removeItem("my-prospect-active-section");
  } catch (error) {
    // Aucun traitement supplementaire requis si le stockage local est indisponible.
  }

  const app = document.getElementById("app");
  const auth = document.getElementById("auth");

  if (app) {
    app.style.display = "none";
  }

  if (auth) {
    auth.style.display = "flex";
  }

  if (map) {
    map.remove();
    map = null;
  }

  showToast("Déconnecté 👋");
}
