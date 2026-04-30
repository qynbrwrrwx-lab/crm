let map;
let markers = [];
let chart;

// ================= AUTH =================

async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  showLoader();

  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  hideLoader();

  if (data.success) {
    showToast("Compte créé ✅");
  } else {
    alert(data.error);
  }
}

async function login() {
  showLoader();

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: document.getElementById("email").value,
      password: document.getElementById("password").value
    })
  });

  const data = await res.json();
  hideLoader();

  if (data.success) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";

    showSection("dashboard");

    setTimeout(() => {
      initMap();
      loadClients();
    }, 200);

    showToast("Connexion réussie 🚀");
  } else {
    alert(data.error);
  }
}

// ================= SIDEBAR =================

function showSection(sectionId, event) {
  document.querySelectorAll(".section").forEach(el => {
    el.classList.remove("active");
  });

  document.querySelectorAll(".sidebar button").forEach(btn => {
    btn.classList.remove("active");
  });

  const section = document.getElementById(sectionId);
  if (section) section.classList.add("active");

  if (event) event.currentTarget.classList.add("active");

  if (sectionId === "mapSection" && map) {
    setTimeout(() => map.invalidateSize(), 200);
  }
}

// ================= MAP =================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

function initMap() {
  if (map) return;

  map = L.map("map").setView([48.8566, 2.3522], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  setTimeout(() => map.invalidateSize(), 500);
}

// ================= CHART =================

function updateChart(clients) {
  const ctx = document.getElementById("chart");

  if (!ctx) return;

  const labels = clients.map(c => c.name);
  const data = clients.map(() => 1);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Clients",
        data: data
      }]
    }
  });
}

// ================= CLIENTS =================

async function loadClients() {
  const res = await fetch("/clients");
  const clients = await res.json();

  const list = document.getElementById("list");
  list.innerHTML = "";

  document.getElementById("total").innerText = clients.length;

  if (map) {
    markers.forEach(m => map.removeLayer(m));
  }
  markers = [];

  clients.forEach(c => {

    const div = document.createElement("div");
    div.className = "client";

    div.innerHTML = `
      <div class="client-info">
        <strong>${c.name}</strong><br>
        ${c.phone}<br>
        ${c.address || ""}
      </div>
      <button class="delete" onclick="deleteClient('${c._id}')">❌</button>
    `;

    list.appendChild(div);

    if (c.lat && c.lng && map) {
      const marker = L.marker([c.lat, c.lng])
        .addTo(map)
        .bindPopup(
          `<b>${c.name}</b><br>${c.phone}<br>${c.address || ""}`
        );

      markers.push(marker);
    }
  });

  updateChart(clients);
}

// ================= ADD CLIENT =================

async function addClient() {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const address = document.getElementById("address").value;

  if (!address) {
    alert("Adresse obligatoire ❗");
    return;
  }

  showLoader();

  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );

    const geoData = await geoRes.json();

    if (!geoData.length) {
      hideLoader();
      alert("Adresse introuvable ❌");
      return;
    }

    const lat = parseFloat(geoData[0].lat);
    const lng = parseFloat(geoData[0].lon);

    await fetch("/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, address, lat, lng })
    });

    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("address").value = "";

    await loadClients();

    showToast("Client ajouté ✅");

  } catch (err) {
    console.error(err);
    alert("Erreur ❌");
  }

  hideLoader();
}

// ================= DELETE =================

async function deleteClient(id) {
  await fetch("/clients/" + id, { method: "DELETE" });
  loadClients();
  showToast("Client supprimé 🗑️");
}

// ================= TOAST =================

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerText = msg;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// ================= LOADER =================

function showLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "flex";
}

function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
}

// ================= LOGOUT =================

function logout() {
  document.getElementById("app").style.display = "none";
  document.getElementById("auth").style.display = "flex";

  document.getElementById("email").value = "";
  document.getElementById("password").value = "";

  if (map) {
    map.remove();
    map = null;
  }

  showToast("Déconnecté 👋");
}