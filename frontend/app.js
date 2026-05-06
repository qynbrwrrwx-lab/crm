// ================= GLOBAL =================

let map;
let markers = [];

let chart;
let analyticsChart;

let draggedClient = null;

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

  const res = await fetch(url, config);

  // SESSION EXPIRE
  if (res.status === 401) {

    logout();

    throw new Error("Session expirée");
  }

  // API ERROR
  if (!res.ok) {

    const err =
      await res.json().catch(() => ({}));

    throw new Error(
      err.error || "Erreur API"
    );
  }

  return res.json();
}

// ================= INIT =================

window.onload = () => {

  if (getToken()) {
    showApp();
  }
};

function showApp() {

  document.getElementById("auth").style.display = "none";

  document.getElementById("app").style.display = "block";

  initMap();

  loadClients();
}

// ================= AUTH =================

async function register() {

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  showLoader();

  try {

    await apiFetch("/register", {
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

async function login() {

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  showLoader();

  try {

    const data = await apiFetch("/login", {
      method: "POST",

      body: JSON.stringify({
        email,
        password
      })
    });

    setToken(data.token);

    showApp();

    showToast("Bienvenue 🚀");

  } catch (err) {

    showToast(err.message);
  }

  hideLoader();
}

// ================= SIDEBAR =================

function showSection(sectionId, event) {

  document
    .querySelectorAll(".section")
    .forEach(el => {
      el.classList.remove("active");
    });

  document
    .querySelectorAll(".sidebar button")
    .forEach(btn => {
      btn.classList.remove("active");
    });

  document
    .getElementById(sectionId)
    ?.classList.add("active");

  event?.currentTarget
    .classList.add("active");

  // MAP
  if (sectionId === "mapSection" && map) {

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }

  // FAVORITES
  if (sectionId === "favorites") {
    loadFavorites();
  }

  // ANALYTICS
  if (sectionId === "analytics") {
    loadAnalytics();
  }

  // SETTINGS
  if (sectionId === "settings") {
    loadUserInfo();
  }

  // 🚀 PIPELINE
  if (sectionId === "pipeline") {
    loadPipeline();
  }
}

// ================= MAP =================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({

  iconRetinaUrl:
    "https://unpkg.com/leaflet/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet/dist/images/marker-shadow.png"
});

function initMap() {

  if (map) return;

  map = L.map("map")
    .setView([48.8566, 2.3522], 5);

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  ).addTo(map);
}

// ================= DASHBOARD =================

function updateChart(clients) {

  const ctx =
    document.getElementById("chart");

  if (!ctx) return;

  const counts = {};

  clients.forEach(client => {

    const date = client.createdAt
      ? new Date(client.createdAt)
          .toLocaleDateString()
      : "Unknown";

    counts[date] =
      (counts[date] || 0) + 1;
  });

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {

    type: "line",

    data: {

      labels: Object.keys(counts),

      datasets: [{
        label: "Nouveaux clients",

        data: Object.values(counts),

        fill: true
      }]
    }
  });
}

// ================= KPI =================

function updateKPI(clients) {

  document.getElementById("total")
    .innerText = clients.length;

  const favorites =
    clients.filter(c => c.favorite).length;

  document.getElementById("favCount")
    .innerText = favorites;

  const recent =
    clients.slice(0, 5).length;

  document.getElementById("newCount")
    .innerText = recent;
}

// ================= ANALYTICS =================

async function loadAnalytics() {

  const clients =
    await apiFetch("/clients");

  const ctx =
    document.getElementById("analyticsChart");

  const favorites =
    clients.filter(c => c.favorite).length;

  if (analyticsChart) {
    analyticsChart.destroy();
  }

  analyticsChart = new Chart(ctx, {

    type: "doughnut",

    data: {

      labels: [
        "Favoris",
        "Autres"
      ],

      datasets: [{
        data: [
          favorites,
          clients.length - favorites
        ]
      }]
    }
  });
}

// ================= FAVORITES =================

async function loadFavorites() {

  const clients =
    await apiFetch("/clients");

  const favorites =
    clients.filter(c => c.favorite);

  const container =
    document.getElementById("favoritesList");

  container.innerHTML = "";

  favorites.forEach(client => {

    container.innerHTML += `
      <div class="client">

        <div>
          <strong>${client.name}</strong><br>
          ${client.phone}
        </div>

      </div>
    `;
  });
}

// ================= SETTINGS =================

async function loadUserInfo() {

  const clients =
    await apiFetch("/clients");

  document.getElementById("userStats")
    .innerText = clients.length;
}

// ================= RENDER CLIENTS =================

function renderClients(clients) {

  const list =
    document.getElementById("list");

  list.innerHTML = "";

  clients.forEach(client => {

    list.innerHTML += `
      <div class="client">

        <div class="client-info">

          <strong>
            ${client.name}
          </strong>

          ${client.favorite ? "⭐" : ""}

          <br>

          ${client.phone}

          <br>

          ${client.address || ""}

        </div>

        <div>

          <button
            onclick="toggleFavorite('${client._id}')"
          >
            ⭐
          </button>

          <button
            class="delete"
            onclick="deleteClient('${client._id}')"
          >
            ❌
          </button>

        </div>

      </div>
    `;
  });
}

// ================= LOAD CLIENTS =================

async function loadClients(query = "") {

  let url = "/clients";

  if (query) {
    url += `?${query}`;
  }

  const clients =
    await apiFetch(url);

  updateKPI(clients);

  renderClients(clients);

  updateChart(clients);

  // MAP MARKERS
  if (map) {

    markers.forEach(marker => {
      map.removeLayer(marker);
    });

    markers = [];

    clients.forEach(client => {

      if (client.lat && client.lng) {

        const marker =
          L.marker([
            client.lat,
            client.lng
          ])
          .addTo(map)
          .bindPopup(`
            <b>${client.name}</b>
          `);

        markers.push(marker);
      }
    });
  }
}

// ================= PIPELINE =================

async function loadPipeline() {

  const clients =
    await apiFetch("/clients");

  const columns = {

    lead:
      document.getElementById("leadColumn"),

    contacted:
      document.getElementById("contactedColumn"),

    proposal:
      document.getElementById("proposalColumn"),

    negotiation:
      document.getElementById("negotiationColumn"),

    won:
      document.getElementById("wonColumn")
  };

  // RESET
  Object.values(columns)
    .forEach(column => {
      column.innerHTML = "";
    });

  // CARDS
  clients.forEach(client => {

    const card =
      document.createElement("div");

    card.className = "pipeline-card";

    card.draggable = true;

    card.innerHTML = `
      <strong>${client.name}</strong>
      <br>
      ${client.phone}
    `;

    // DRAG
    card.addEventListener("dragstart", () => {
      draggedClient = client;
    });

    const status =
      client.status || "lead";

    columns[status]?.appendChild(card);
  });

  // DROP ZONES
  document
    .querySelectorAll(".dropzone")
    .forEach(zone => {

      zone.ondragover = e => {
        e.preventDefault();
      };

      zone.ondrop = async () => {

        const status =
          zone.id
            .replace("Column", "");

        await apiFetch(
          `/clients/status/${draggedClient._id}`,
          {
            method: "PUT",

            body: JSON.stringify({
              status
            })
          }
        );

        loadPipeline();

        showToast("Pipeline mis à jour 🚀");
      };
    });
}

// ================= ACTIONS =================

function filterClients() {

  const query =
    document.getElementById("search").value;

  loadClients(
    query
      ? `search=${encodeURIComponent(query)}`
      : ""
  );
}

async function toggleFavorite(id) {

  await apiFetch(
    `/clients/favorite/${id}`,
    {
      method: "PUT"
    }
  );

  loadClients();
}

async function deleteClient(id) {

  await apiFetch(
    `/clients/${id}`,
    {
      method: "DELETE"
    }
  );

  loadClients();

  showToast("Client supprimé 🗑️");
}

async function addClient() {

  const name =
    document.getElementById("name").value;

  const phone =
    document.getElementById("phone").value;

  const address =
    document.getElementById("address").value;

  if (!address) {
    return showToast(
      "Adresse obligatoire ❗"
    );
  }

  showLoader();

  // GEOLOC
  const geoRes = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
  );

  const geoData =
    await geoRes.json();

  if (!geoData.length) {

    hideLoader();

    return showToast(
      "Adresse introuvable ❌"
    );
  }

  await apiFetch("/clients", {

    method: "POST",

    body: JSON.stringify({

      name,
      phone,
      address,

      lat: parseFloat(geoData[0].lat),

      lng: parseFloat(geoData[0].lon)
    })
  });

  // RESET INPUTS
  document.getElementById("name").value = "";

  document.getElementById("phone").value = "";

  document.getElementById("address").value = "";

  loadClients();

  hideLoader();

  showToast("Client ajouté ✅");
}

// ================= UI =================

function showToast(message) {

  const toast =
    document.getElementById("toast");

  toast.innerText = message;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function showLoader() {

  document.getElementById("loader")
    .style.display = "flex";
}

function hideLoader() {

  document.getElementById("loader")
    .style.display = "none";
}

// ================= LOGOUT =================

function logout() {

  removeToken();

  document.getElementById("app")
    .style.display = "none";

  document.getElementById("auth")
    .style.display = "flex";

  if (map) {

    map.remove();

    map = null;
  }

  showToast("Déconnecté 👋");
}