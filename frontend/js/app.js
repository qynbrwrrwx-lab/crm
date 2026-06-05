// ================= GLOBAL =================
const API_URL = "https://www.my-prospect.com";



let map;
let markers = [];

let chart;
let analyticsChart;




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









