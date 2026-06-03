// ================= TOKEN =================

function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function removeToken() {
  localStorage.removeItem("token");
}

// ================= REGISTER =================

async function register() {

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  showLoader();

  try {

    await apiFetch("/api/auth/register", {

      method: "POST",

      body: JSON.stringify({
        email,
        password
      })
    });

    showToast("📩 Vérifie ton email !");

  } catch (err) {

    showToast(err.message);
  }

  hideLoader();
}

// ================= LOGIN =================

async function login() {

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  showLoader();

  try {

    const data =
      await apiFetch("/api/auth/login", {

        method: "POST",

        body: JSON.stringify({
          email,
          password
        })
      });
      
      console.log("LOGIN DATA =", data);
  
      setToken(data.token);

    console.log(
      "TOKEN APRES SET=",
      localStorage.getItem("token")
    ); 

    showApp();

    showToast("Bienvenue 🚀");

  } catch (err) {

    showToast(err.message);
  }

  hideLoader();
}

// ================= LOGOUT =================

function logout() {

  removeToken();

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

// ================= RESET PASSWORD =================

async function resetPassword() {

  const password =
    document.getElementById("newPassword").value;

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

// ================= ADMIN LOGIN =================

async function adminLogin() {

  const email =
    document.getElementById(
      "adminEmail"
    ).value;

  const password =
    document.getElementById(
      "adminPassword"
    ).value;

  try {

    const data =
      await apiFetch(
        "/api/auth/login",
        {
          method: "POST",

          body: JSON.stringify({
            email,
            password
          })
        }
      );

    // TOKEN
    localStorage.setItem(
      "token",
      data.token
    );

    // REDIRECTION ADMIN
    window.location.href =
      "/admin";

  } catch (err) {

    alert(
      err.message
    );
  }
}

// ================= LOGOUT ADMIN =================

function logoutAdmin() {

  localStorage.removeItem(
    "token"
  );

  window.location.href =
    "/admin-login";
  }