let map;
let markers = [];

// ================= AUTH =================

async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  alert(data.success ? "Compte créé ✅" : data.error);
}

async function login() {
  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: document.getElementById("email").value,
      password: document.getElementById("password").value
    })
  });

  const data = await res.json();

  if (data.success) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";

    setTimeout(() => {
  initMap();
}, 200);
        loadClients();
  } else {
    alert(data.error);
  }
}

// ================= MAP =================

// 🔥 FIX ICONES LEAFLET
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

function initMap() {
  if (map) return;

  map = L.map("map").setView([48.8566, 2.3522], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  // 🔥 FIX écran gris
  setTimeout(() => {
    map.invalidateSize();
  }, 500);
}

// ================= CLIENTS =================

async function loadClients() {
  const res = await fetch("/clients");
  const clients = await res.json();

  const list = document.getElementById("list");
  list.innerHTML = "";

  document.getElementById("total").innerText = clients.length;

  // nettoyer anciens markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  clients.forEach(c => {
    // LISTE
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

    // MAP
    if (c.lat && c.lng) {
      const marker = L.marker([c.lat, c.lng])
        .addTo(map)
        .bindPopup(
          `<b>${c.name}</b><br>${c.phone}<br>${c.address || ""}`
        );

      markers.push(marker);
    }
  });
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

  try {
    // 🔥 géocodage adresse → coordonnées
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
    );

    const geoData = await geoRes.json();

    if (!geoData.length) {
      alert("Adresse introuvable ❌");
      return;
    }

    const lat = parseFloat(geoData[0].lat);
    const lng = parseFloat(geoData[0].lon);

    // 🔥 enregistrement en base MongoDB
    await fetch("/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, phone, address, lat, lng })
    });

    loadClients();

  } catch (err) {
    console.error(err);
    alert("Erreur géolocalisation ❌");
  }
}

// ================= DELETE =================

async function deleteClient(id) {
  await fetch("/clients/" + id, {
    method: "DELETE"
  });

  loadClients();
}