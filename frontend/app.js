// ================= GLOBAL =================
let map;
let markers = [];
let chart;
let analyticsChart;

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
      ...(token && { Authorization: "Bearer " + token })
    },
    ...options
  };

  const res = await fetch(url, config);

  if (res.status === 401) {
    logout();
    throw new Error("Session expirée");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erreur API");
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
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  showLoader();

  try {
    await apiFetch("/register", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });

    showToast("📩 Vérifie ton email !");
  } catch (err) {
    showToast(err.message);
  }

  hideLoader();
}

async function login() {
  showLoader();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const data = await apiFetch("/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
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
  document.querySelectorAll(".section").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".sidebar button").forEach(btn => btn.classList.remove("active"));

  document.getElementById(sectionId)?.classList.add("active");
  event?.currentTarget.classList.add("active");

  if (sectionId === "mapSection" && map) {
    setTimeout(() => map.invalidateSize(), 200);
  }

  if (sectionId === "favorites") loadFavorites();
  if (sectionId === "analytics") loadAnalytics();
  if (sectionId === "settings") loadUserInfo();
}

// ================= MAP =================
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet/dist/images/marker-shadow.png"
});

function initMap() {
  if (map) return;

  map = L.map("map").setView([48.8566, 2.3522], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
}

// ================= DASHBOARD =================
function updateChart(clients) {
  const ctx = document.getElementById("chart");
  if (!ctx) return;

  const counts = {};

  clients.forEach(c => {
    const date = c.createdAt
      ? new Date(c.createdAt).toLocaleDateString()
      : "Unknown";

    counts[date] = (counts[date] || 0) + 1;
  });

  if (chart) chart.destroy();

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
  document.getElementById("total").innerText = clients.length;

  const fav = clients.filter(c => c.favorite).length;
  document.getElementById("favCount").innerText = fav;

  const recent = clients.slice(0, 5).length;
  document.getElementById("newCount").innerText = recent;
}

// ================= ANALYTICS =================
async function loadAnalytics() {
  const clients = await apiFetch("/clients");

  const ctx = document.getElementById("analyticsChart");
  const favorites = clients.filter(c => c.favorite).length;

  if (analyticsChart) analyticsChart.destroy();

  analyticsChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Favoris", "Autres"],
      datasets: [{
        data: [favorites, clients.length - favorites]
      }]
    }
  });
}

// ================= FAVORITES =================
async function loadFavorites() {
  const clients = await apiFetch("/clients?favorite=true");

  const container = document.getElementById("favoritesList");
  container.innerHTML = "";

  clients.forEach(c => {
    container.innerHTML += `
      <div class="client">
        <strong>${c.name}</strong><br>
        ${c.phone}
      </div>
    `;
  });
}

// ================= SETTINGS =================
async function loadUserInfo() {
  const clients = await apiFetch("/clients");
  document.getElementById("userStats").innerText = clients.length;
}

// ================= RENDER =================
function renderClients(clients) {
  const list = document.getElementById("list");
  list.innerHTML = "";

  clients.forEach(c => {
    list.innerHTML += `
      <div class="client">
        <div>
          <strong>${c.name}</strong> ${c.favorite ? "⭐" : ""}<br>
          ${c.phone}<br>
          ${c.address || ""}
        </div>
        <div>
          <button onclick="toggleFavorite('${c._id}')">⭐</button>
          <button class="delete" onclick="deleteClient('${c._id}')">❌</button>
        </div>
      </div>
    `;
  });
}

// ================= LOAD CLIENTS =================
async function loadClients(query = "") {
  let url = "/clients";
  if (query) url += `?${query}`;

  const clients = await apiFetch(url);

  updateKPI(clients);
  renderClients(clients);
  updateChart(clients);

  if (map) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    clients.forEach(c => {
      if (c.lat && c.lng) {
        const marker = L.marker([c.lat, c.lng])
          .addTo(map)
          .bindPopup(`<b>${c.name}</b>`);
        markers.push(marker);
      }
    });
  }
}

// ================= ACTIONS =================
function filterClients() {
  const query = document.getElementById("search").value;
  loadClients(query ? `search=${encodeURIComponent(query)}` : "");
}

async function toggleFavorite(id) {
  await apiFetch(`/clients/favorite/${id}`, { method: "PUT" });
  loadClients();
}

async function deleteClient(id) {
  await apiFetch(`/clients/${id}`, { method: "DELETE" });
  loadClients();
  showToast("Client supprimé 🗑️");
}

async function addClient() {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const address = document.getElementById("address").value;

  if (!address) return showToast("Adresse obligatoire ❗");

  showLoader();

  const geoRes = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
  );
  const geoData = await geoRes.json();

  if (!geoData.length) {
    hideLoader();
    return showToast("Adresse introuvable ❌");
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

  document.getElementById("name").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("address").value = "";

  loadClients();
  hideLoader();
  showToast("Client ajouté ✅");
}

// ================= UI =================
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

// ================= LOGOUT =================
function logout() {
  removeToken();

  document.getElementById("app").style.display = "none";
  document.getElementById("auth").style.display = "flex";

  if (map) {
    map.remove();
    map = null;
  }

  showToast("Déconnecté 👋");
}