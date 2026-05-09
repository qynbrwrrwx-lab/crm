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

  document.getElementById("auth")
    .style.display = "none";

  document.getElementById("app")
    .style.display = "block";

  initMap();

  loadContacts();

  loadProducts();
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

    const data =
      await apiFetch("/login", {

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

  // PRODUCTS
  if (sectionId === "products") {
    loadProducts();
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

function updateChart(contacts) {

  const ctx =
    document.getElementById("chart");

  if (!ctx) return;

  const counts = {};

  contacts.forEach(contact => {

    const date = contact.createdAt
      ? new Date(contact.createdAt)
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
        label: "Nouveaux contacts",

        data: Object.values(counts),

        fill: true
      }]
    }
  });
}

// ================= KPI =================

function updateKPI(contacts) {

  document.getElementById("total")
    .innerText = contacts.length;

  const favorites =
    contacts.filter(c => c.favorite).length;

  document.getElementById("favCount")
    .innerText = favorites;

  const recent =
    contacts.slice(0, 5).length;

  document.getElementById("newCount")
    .innerText = recent;
}

// ================= ANALYTICS =================

async function loadAnalytics() {

  const contacts =
    await apiFetch("/contacts");

  const ctx =
    document.getElementById("analyticsChart");

  const favorites =
    contacts.filter(c => c.favorite).length;

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
          contacts.length - favorites
        ]
      }]
    }
  });
}

// ================= FAVORITES =================

async function loadFavorites() {

  const contacts =
    await apiFetch("/contacts");

  const favorites =
    contacts.filter(c => c.favorite);

  const container =
    document.getElementById("favoritesList");

  container.innerHTML = "";

  favorites.forEach(contact => {

    container.innerHTML += `
      <div class="client">

        <div>

          <strong>
            ${contact.firstname || ""}
            ${contact.lastname || ""}
          </strong>

          <br>

          ${contact.phone || ""}

          <br>

          ${contact.companyName || ""}

        </div>

      </div>
    `;
  });
}

// ================= SETTINGS =================

async function loadUserInfo() {

  const contacts =
    await apiFetch("/contacts");

  document.getElementById("userStats")
    .innerText = contacts.length;
}

// ================= RENDER CONTACTS =================

function renderContacts(contacts) {

  const list =
    document.getElementById("list");

  list.innerHTML = "";

  contacts.forEach(contact => {

    list.innerHTML += `

      <div class="client">

        <div class="client-info">

          <strong>

            ${contact.firstname || ""}
            ${contact.lastname || ""}

          </strong>

          ${contact.favorite ? "⭐" : ""}

          <br>

          ${contact.companyName || ""}

          <br>

          ${contact.email || ""}

          <br>

          ${contact.phone || ""}

          <br>

          ${contact.billingAddress || ""}

        </div>

        <div>

          <button
            onclick="toggleFavorite('${contact._id}')"
          >
            ⭐
          </button>

          <button
            class="delete"
            onclick="deleteContact('${contact._id}')"
          >
            ❌
          </button>

        </div>

      </div>
    `;
  });
}

// ================= LOAD CONTACTS =================

async function loadContacts(query = "") {

  let url = "/contacts";

  if (query) {
    url += `?${query}`;
  }

  const contacts =
    await apiFetch(url);

  updateKPI(contacts);

  renderContacts(contacts);

  updateChart(contacts);

  // MAP MARKERS
  if (map) {

    markers.forEach(marker => {
      map.removeLayer(marker);
    });

    markers = [];

    contacts.forEach(contact => {

      if (
        contact.lat &&
        contact.lng
      ) {

        const marker =
          L.marker([
            contact.lat,
            contact.lng
          ])
          .addTo(map)
          .bindPopup(`

            <b>
              ${contact.firstname || ""}
              ${contact.lastname || ""}
            </b>

          `);

        markers.push(marker);
      }
    });
  }
}

// ================= PRODUCTS =================

// LOAD PRODUCTS
async function loadProducts() {

  const products =
    await apiFetch("/products");

  renderProducts(products);
}

// RENDER PRODUCTS
function renderProducts(products) {

  const list =
    document.getElementById("productsList");

  if (!list) return;

  list.innerHTML = "";

  products.forEach(product => {

    list.innerHTML += `

      <div class="client">

        <div class="client-info">

          <strong>
            ${product.name}
          </strong>

          <br>

          Réf :
          ${product.reference || "-"}

          <br>

          HT :
          ${Number(product.priceHT).toFixed(2)} €

          <br>

          TVA :
          ${product.tva} %

          <br>

          TTC :
          ${Number(product.priceTTC).toFixed(2)} €

          <br>

          Stock :
          ${product.stock}

        </div>

        <div>

          <button
            class="delete"
            onclick="deleteProduct('${product._id}')"
          >
            ❌
          </button>

        </div>

      </div>
    `;
  });
}

// ADD PRODUCT
async function addProduct() {

  const name =
    document.getElementById("productName").value;

  const reference =
    document.getElementById("productReference").value;

  const description =
    document.getElementById("productDescription").value;

  const priceHT =
    document.getElementById("productPriceHT").value;

  const tva =
    document.getElementById("productTVA").value;

  const stock =
    document.getElementById("productStock").value;

  if (!name || !priceHT) {

    return showToast(
      "Nom et prix obligatoires ❗"
    );
  }

  showLoader();

  try {

    await apiFetch("/products", {

      method: "POST",

      body: JSON.stringify({

        name,
        reference,
        description,
        priceHT,
        tva,
        stock
      })
    });

    // RESET INPUTS
    document.getElementById("productName").value = "";

    document.getElementById("productReference").value = "";

    document.getElementById("productDescription").value = "";

    document.getElementById("productPriceHT").value = "";

    document.getElementById("productTVA").value = "20";

    document.getElementById("productStock").value = "";

    loadProducts();

    showToast("Produit ajouté ✅");

  } catch (err) {

    showToast(err.message);
  }

  hideLoader();
}

// DELETE PRODUCT
async function deleteProduct(id) {

  await apiFetch(
    `/products/${id}`,
    {
      method: "DELETE"
    }
  );

  loadProducts();

  showToast("Produit supprimé 🗑️");
}

// ================= ACTIONS =================

function filterContacts() {

  const query =
    document.getElementById("search").value;

  loadContacts(
    query
      ? `search=${encodeURIComponent(query)}`
      : ""
  );
}

async function toggleFavorite(id) {

  await apiFetch(
    `/contacts/favorite/${id}`,
    {
      method: "PUT"
    }
  );

  loadContacts();
}

async function deleteContact(id) {

  await apiFetch(
    `/contacts/${id}`,
    {
      method: "DELETE"
    }
  );

  loadContacts();

  showToast("Contact supprimé 🗑️");
}

// ================= ADD CONTACT =================

async function addContact() {

  const type =
    document.getElementById("type").value;

  const firstname =
    document.getElementById("firstname").value;

  const lastname =
    document.getElementById("lastname").value;

  const companyName =
    document.getElementById("companyName").value;

  const siret =
    document.getElementById("siret").value;

  const email =
    document.getElementById("emailContact").value;

  const phone =
    document.getElementById("phone").value;

  const billingAddress =
    document.getElementById("billingAddress").value;

  const shippingAddress =
    document.getElementById("shippingAddress").value;

  const notes =
    document.getElementById("notes").value;

  if (!billingAddress) {

    return showToast(
      "Adresse obligatoire ❗"
    );
  }

  showLoader();

  // GEOLOC
  const geoRes = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(billingAddress)}`
  );

  const geoData =
    await geoRes.json();

  let lat = null;
  let lng = null;

  if (geoData.length) {

    lat =
      parseFloat(geoData[0].lat);

    lng =
      parseFloat(geoData[0].lon);
  }

  await apiFetch("/contacts", {

    method: "POST",

    body: JSON.stringify({

      type,

      firstname,
      lastname,

      companyName,

      siret,

      email,

      phone,

      billingAddress,

      shippingAddress,

      notes,

      lat,
      lng
    })
  });

  // RESET INPUTS
  document.getElementById("firstname").value = "";

  document.getElementById("lastname").value = "";

  document.getElementById("companyName").value = "";

  document.getElementById("siret").value = "";

  document.getElementById("emailContact").value = "";

  document.getElementById("phone").value = "";

  document.getElementById("billingAddress").value = "";

  document.getElementById("shippingAddress").value = "";

  document.getElementById("notes").value = "";

  loadContacts();

  hideLoader();

  showToast("Contact ajouté ✅");
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