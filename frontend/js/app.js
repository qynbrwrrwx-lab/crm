// ================= GLOBAL =================
// Par défaut, le frontend utilise le serveur qui l'a servi (localhost ou production).
// Une URL peut être fournie avant le chargement via window.MY_PROSPECT_API_URL si besoin.
const API_URL = window.MY_PROSPECT_API_URL || window.location.origin;



let map;
let markers = [];

let chart;
let analyticsChart;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}




// ================= API =================

async function apiFetch(url, options = {}) {

  const token = getToken();

  const config = {

    headers: {

      "Content-Type": "application/json",

      ...(token && {
        Authorization: "Bearer " + token
      })
    },

    ...options
  };

  try {

    const res = await fetch(
      API_URL + url,
      config
    );

    if (res.status === 401) {

      logout();

      throw new Error(
        "Session expirée"
      );
    }

    if (!res.ok) {

      let err = {};

      try {

        err = await res.json();

      } catch {

        err = {
          error: "Erreur serveur"
        };
      }

      console.error(
        "❌ API ERROR :",
        err
      );

      throw new Error(
        err.error || "Erreur API"
      );
    }

    return await res.json();

  } catch (err) {

    console.error(
      "❌ FETCH ERROR :",
      err
    );

    throw err;
  }
}

// ================= INIT =================

window.onload = () => {

  if (getToken()) {
    showApp();
  }
};









