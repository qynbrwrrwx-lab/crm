const path = window.location.pathname;

if (path.includes("/reset-password/")) {

  document.body.innerHTML = `

  <div style="
    min-height:100vh;

    display:flex;
    justify-content:center;
    align-items:center;

    background:
    radial-gradient(
      circle at bottom,
      #2563eb 0%,
      #0f172a 45%,
      #020617 100%
    );

    font-family:Inter,sans-serif;

    padding:20px;
  ">

    <div style="
      width:100%;
      max-width:420px;

      position:relative;

      background:rgba(15,23,42,0.78);

      border:1px solid rgba(255,255,255,0.08);

      backdrop-filter:blur(18px);

      border-radius:28px;

      padding:34px 34px 30px 34px;

      box-shadow:
        0 0 60px rgba(37,99,235,0.35),
        0 0 120px rgba(37,99,235,0.18);

      text-align:center;
    ">

      <img
        src="/logo.png"
        alt="My Prospect"
        style="
          width:450px;

          margin-top:-118px;
          margin-bottom:-82px;

          object-fit:contain;

          display:block;

          margin-left:auto;
          margin-right:auto;
        "
      >

      <p style="
        color:#e2e8f0;

        font-size:16px;

        line-height:1.5;

        margin-top:8px;

        margin-bottom:24px;

        font-weight:500;
      ">
        Sécurisez votre compte avec un nouveau mot de passe.
      </p>

      <div style="
        position:relative;

        margin-bottom:18px;
      ">

        <input
          id="newPassword"
          type="password"
          placeholder="Nouveau mot de passe"

          style="
            width:100%;

            padding:18px 55px 18px 18px;

            border:none;

            border-radius:16px;

            background:#0f172a;

            color:white;

            font-size:16px;

            outline:none;

            box-sizing:border-box;
          "
        >

        <button
          onclick="togglePassword()"

          style="
            position:absolute;

            right:18px;

            top:50%;

            transform:translateY(-50%);

            background:transparent;

            border:none;

            color:#94a3b8;

            cursor:pointer;

            display:flex;

            align-items:center;

            justify-content:center;

            padding:0;
          "
        >

          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"></path>

            <circle cx="12" cy="12" r="3"></circle>
          </svg>

        </button>

      </div>

      <button
        onclick="resetPassword()"

        style="
          width:100%;

          padding:18px;

          border:none;

          border-radius:16px;

          background:
          linear-gradient(
            90deg,
            #22d3ee,
            #2563eb
          );

          color:white;

          font-size:17px;

          font-weight:700;

          cursor:pointer;

          transition:0.3s;

          box-shadow:
            0 10px 30px rgba(37,99,235,0.35);
        "
      >
        Modifier le mot de passe
      </button>

    </div>

  </div>

  `;
}

if (path.includes("/verify-email/")) {

  document.body.innerHTML = `

    <div style="
      min-height:100vh;
      display:flex;
      justify-content:center;
      align-items:center;

      background:
      radial-gradient(
        circle at bottom,
        #2563eb 0%,
        #0f172a 45%,
        #020617 100%
      );

      font-family:Inter,sans-serif;
      padding:20px;
    ">

      <div style="
        width:100%;
        max-width:420px;

        background:rgba(15,23,42,0.78);

        border:1px solid rgba(255,255,255,0.08);

        backdrop-filter:blur(18px);

        border-radius:28px;

        padding:34px 34px 30px 34px;

        box-shadow:
          0 0 60px rgba(37,99,235,0.35),
          0 0 120px rgba(37,99,235,0.18);

        text-align:center;
      ">

        <img
          src="/logo.png"
          alt="My Prospect"
          style="
            width:450px;

            margin-top:-118px;
            margin-bottom:-82px;

            object-fit:contain;

            display:block;

            margin-left:auto;
            margin-right:auto;
          "
        >

        <h1 style="
          color:white;

          font-size:20px;

          line-height:1.1;

          margin:0 0 12px 0;

          font-weight:800;

          letter-spacing:-0.5px;
        ">
          ✅ Email validé
        </h1>

        <p style="
          color:#e2e8f0;

          font-size:16px;

          line-height:1.5;

          margin-bottom:24px;

          font-weight:500;
        ">
          Votre adresse email a bien été confirmée.
        </p>

        <a
          href="/login"
          style="
            display:flex;

            justify-content:center;
            align-items:center;

            width:100%;

            padding:18px;

            border:none;

            border-radius:16px;

            background:
            linear-gradient(
              90deg,
              #22d3ee,
              #2563eb
            );

            color:white;

            font-size:17px;

            font-weight:700;

            text-decoration:none;

            cursor:pointer;

            box-sizing:border-box;

            box-shadow:
              0 10px 30px rgba(37,99,235,0.35);

            transition:0.3s;
          "
        >
          Accéder à l’application
        </a>

      </div>

    </div>

  `;
}

if (path.includes("/verify-email-success")) {

  document.body.innerHTML = `

  <div style="
    min-height:100vh;
    display:flex;
    justify-content:center;
    align-items:center;

    background:
    radial-gradient(
      circle at bottom,
      #2563eb 0%,
      #0f172a 45%,
      #020617 100%
    );

    font-family:Inter,sans-serif;
    padding:20px;
  ">

    <div style="
      width:100%;
      max-width:420px;

      background:rgba(15,23,42,0.78);

      border:1px solid rgba(255,255,255,0.08);

      backdrop-filter:blur(18px);

      border-radius:28px;

      padding:34px 34px 30px 34px;

      box-shadow:
        0 0 60px rgba(37,99,235,0.35),
        0 0 120px rgba(37,99,235,0.18);

      text-align:center;
    ">

      <img
        src="/logo.png"
        style="
          width:450px;
          margin-top:-118px;
          margin-bottom:-82px;
          object-fit:contain;
          display:block;
          margin-left:auto;
          margin-right:auto;
        "
      >

      <h1 style="
        color:white;
        font-size:20px;
        margin-bottom:14px;
        font-weight:800;
      ">
        ✅ Email validé
      </h1>

      <p style="
        color:#e2e8f0;
        font-size:16px;
        line-height:1.5;
        margin-bottom:24px;
      ">
        Votre adresse email a bien été confirmée.
      </p>

      <a
        href="/login"

        style="
          display:flex;
          justify-content:center;
          align-items:center;

          width:100%;

          padding:18px;

          border-radius:16px;

          background:
          linear-gradient(
            90deg,
            #22d3ee,
            #2563eb
          );

          color:white;

          text-decoration:none;

          font-size:17px;

          font-weight:700;

          box-sizing:border-box;
        "
      >
        Accéder à l’application
      </a>

    </div>

  </div>

  `;
}

if (path.includes("/verify-email-already")) {

  document.body.innerHTML = `

  <div style="
    min-height:100vh;
    display:flex;
    justify-content:center;
    align-items:center;

    background:
    radial-gradient(
      circle at bottom,
      #2563eb 0%,
      #0f172a 45%,
      #020617 100%
    );

    font-family:Inter,sans-serif;
    padding:20px;
  ">

    <div style="
      width:100%;
      max-width:420px;

      background:rgba(15,23,42,0.78);

      border:1px solid rgba(255,255,255,0.08);

      backdrop-filter:blur(18px);

      border-radius:28px;

      padding:34px 34px 30px 34px;

      box-shadow:
        0 0 60px rgba(37,99,235,0.35),
        0 0 120px rgba(37,99,235,0.18);

      text-align:center;
    ">

      <img
        src="/logo.png"
        style="
          width:450px;
          margin-top:-118px;
          margin-bottom:-82px;
          object-fit:contain;
          display:block;
          margin-left:auto;
          margin-right:auto;
        "
      >

      <h1 style="
        color:white;
        font-size:20px;
        margin-bottom:14px;
        font-weight:800;
      ">
        ℹ️ Email déjà validé
      </h1>

      <p style="
        color:#e2e8f0;
        font-size:16px;
        line-height:1.5;
        margin-bottom:24px;
      ">
        Votre adresse email a déjà été confirmée.
      </p>

      <a
        href="/login"

        style="
          display:flex;
          justify-content:center;
          align-items:center;

          width:100%;

          padding:18px;

          border-radius:16px;

          background:
          linear-gradient(
            90deg,
            #22d3ee,
            #2563eb
          );

          color:white;

          text-decoration:none;

          font-size:17px;

          font-weight:700;

          box-sizing:border-box;
        "
      >
        Accéder à l’application
      </a>

    </div>

  </div>

  `;
}

if (path.includes("/verify-email-error")) {

  document.body.innerHTML = `

  <div style="
    min-height:100vh;
    display:flex;
    justify-content:center;
    align-items:center;

    background:
    radial-gradient(
      circle at bottom,
      #2563eb 0%,
      #0f172a 45%,
      #020617 100%
    );

    font-family:Inter,sans-serif;
    padding:20px;
  ">

    <div style="
      width:100%;
      max-width:420px;

      background:rgba(15,23,42,0.78);

      border:1px solid rgba(255,255,255,0.08);

      backdrop-filter:blur(18px);

      border-radius:28px;

      padding:34px 34px 30px 34px;

      box-shadow:
        0 0 60px rgba(37,99,235,0.35),
        0 0 120px rgba(37,99,235,0.18);

      text-align:center;
    ">

      <img
        src="/logo.png"
        style="
          width:450px;
          margin-top:-118px;
          margin-bottom:-82px;
          object-fit:contain;
          display:block;
          margin-left:auto;
          margin-right:auto;
        "
      >

      <h1 style="
        color:white;
        font-size:20px;
        margin-bottom:14px;
        font-weight:800;
      ">
        ❌ Lien invalide
      </h1>

      <p style="
        color:#e2e8f0;
        font-size:16px;
        line-height:1.5;
        margin-bottom:24px;
      ">
        Ce lien de validation est expiré ou invalide.
      </p>

      <a
        href="/login"

        style="
          display:flex;
          justify-content:center;
          align-items:center;

          width:100%;

          padding:18px;

          border-radius:16px;

          background:
          linear-gradient(
            90deg,
            #22d3ee,
            #2563eb
          );

          color:white;

          text-decoration:none;

          font-size:17px;

          font-weight:700;

          box-sizing:border-box;
        "
      >
        Retour à l’application
      </a>

    </div>

  </div>

  `;
}

function togglePassword() {

  const input =
    document.getElementById("newPassword");

  input.type =
    input.type === "password"
      ? "text"
      : "password";
}

// ================= VERIFY EMAIL ALREADY =================

if (path.includes("/verify-email-already")) {

  document.body.innerHTML = `

    <div style="
      min-height:100vh;
      display:flex;
      justify-content:center;
      align-items:center;
      background:linear-gradient(
        135deg,
        #2563eb 0%,
        #0f172a 45%,
        #020617 100%
      );
      font-family:Inter,sans-serif;
      padding:20px;
    ">

      <div style="
        width:100%;
        max-width:420px;
        position:relative;
        background:rgba(15,23,42,0.78);
        border:1px solid rgba(255,255,255,0.08);
        backdrop-filter:blur(18px);
        border-radius:28px;
        padding:55px 34px 30px 34px;
        box-shadow:0 0 50px rgba(37,99,235,0.25);
        text-align:center;
      ">

        <img
          src="/logo.png"
          alt="My Prospect"
          style="
            width:450px;
            margin-top:-120px;
            margin-bottom:-90px;
            object-fit:contain;
            display:block;
            margin-left:auto;
            margin-right:auto;
          "
        >

        <h1 style="
          color:white;
          font-size:22px;
          font-weight:800;
          margin-bottom:14px;
        ">
          ℹ️ Email déjà validé
        </h1>

        <p style="
          color:#cbd5e1;
          font-size:15px;
          line-height:1.5;
          margin-bottom:24px;
        ">
          Cette adresse email a déjà été confirmée.
        </p>

        <a
          href="/login"
          style="
            display:block;
            width:100%;
            box-sizing:border-box;
            text-decoration:none;
            padding:16px;
            border:none;
            border-radius:16px;
            background:linear-gradient(90deg,#22d3ee,#2563eb);
            color:white;
            font-size:17px;
            font-weight:700;
            cursor:pointer;
            box-shadow:0 10px 30px rgba(37,99,235,0.35);
          "
        >
          Accéder à l’application
        </a>

      </div>

    </div>

  `;
}

// ================= GLOBAL =================
const API_URL = "https://www.my-prospect.com";

let companyLogoBase64 = "";

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

function showApp() {

  document.getElementById("auth")
    .style.display = "none";

  document.getElementById("app")
    .style.display = "block";

  initMap();

  loadContacts().catch(console.error);

  loadProducts().catch(console.error);

  loadInvoices().catch(console.error);

  loadInvoiceData().catch(console.error);
}

// ================= AUTH =================

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
      
      console.log("ADMIN LOGIN DATA =", data);

      console.log("TOKEN =", data.token);

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

  // ANALYTICS
  if (sectionId === "analytics") {
    loadAnalytics();
  }

  // COMPANY
  if (sectionId === "company") {
    loadCompany();
  }

  // SETTINGS
  if (sectionId === "settings") {
    loadUserInfo();
  }

  // PRODUCTS
  if (sectionId === "products") {
    loadProducts();
  }

  // INVOICES
  if (sectionId === "invoices") {

    loadInvoices();

    loadInvoiceData();
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
  await apiFetch("/api/contacts");

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
  await apiFetch("/api/contacts");

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
  await apiFetch("/api/contacts");

  document.getElementById("userStats")
    .innerText = contacts.length;
}

// ================= CONTACTS =================

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

async function loadContacts(query = "") {

  let url = "/api/contacts";

  if (query) {
    url += `?${query}`;
  }

  const contacts =
    await apiFetch(url);

  updateKPI(contacts);

  renderContacts(contacts);

  updateChart(contacts);

  // MAP
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

async function loadProducts() {

  const products =
  await apiFetch("/api/products");

  renderProducts(products);
}

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

await apiFetch("/api/products", {

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

    document.getElementById("productName").value = "";

    document.getElementById("productReference").value = "";

    document.getElementById("productDescription").value = "";

    document.getElementById("productPriceHT").value = "";

    document.getElementById("productTVA").value = "20";

    document.getElementById("productStock").value = "";

    loadProducts();

    loadInvoiceData();

    showToast("Produit ajouté ✅");

  } catch (err) {

    showToast(err.message);
  }

  hideLoader();
}

async function deleteProduct(id) {

 await apiFetch(
  `/api/products/${id}`,
    {
      method: "DELETE"
    }
  );

  loadProducts();

  loadInvoiceData();

  showToast("Produit supprimé 🗑️");
}

// ================= INVOICES =================

// LOAD SELECT DATA
async function loadInvoiceData() {

  const contacts =
  await apiFetch("/api/contacts");

const products =
  await apiFetch("/api/products");

  const contactSelect =
    document.getElementById("invoiceContact");

  const productSelect =
    document.getElementById("invoiceProduct");

  if (!contactSelect || !productSelect) return;

  // CONTACTS
  contactSelect.innerHTML =
    `<option value="">Sélectionner un contact</option>`;

  contacts.forEach(contact => {

    contactSelect.innerHTML += `
      <option value="${contact._id}">
        ${contact.firstname || ""}
        ${contact.lastname || ""}
        ${contact.companyName || ""}
      </option>
    `;
  });

  // PRODUCTS
  productSelect.innerHTML =
    `<option value="">Sélectionner un produit</option>`;

  products.forEach(product => {

    productSelect.innerHTML += `
      <option value="${product._id}">
        ${product.name}
        (${product.stock} stock)
      </option>
    `;
  });
}

// LOAD INVOICES
async function loadInvoices() {

  try {

    const invoices =
  await apiFetch("/api/invoices");

    renderInvoices(invoices);

  } catch (err) {

    console.error(err);

    showToast(err.message);
  }
}

// RENDER INVOICES
function renderInvoices(invoices) {

  const invoiceList =
    document.getElementById("invoiceList");

  const quotesList =
    document.getElementById("quotesContainer");

  if (!invoiceList || !quotesList) return;

  invoiceList.innerHTML = "";
  quotesList.innerHTML = "";

  invoices.forEach(invoice => {

    const html = `

      <div class="client">

        <div class="client-info">

          <strong>
            ${invoice.invoiceNumber}
          </strong>

          <br>

          ${
            invoice.type === "quote"
            ? "📄 Devis"
            : "🧾 Facture"
          }

          <br>

          Total TTC :
          ${Number(invoice.totalTTC).toFixed(2)} €

          <br>

          Paiement :
          ${invoice.paymentMethod}

          <br>

          Statut :
          ${
            invoice.paymentStatus === "paid"
            ? "✅ Payé"
            : "⌛ En attente"
          }

        </div>

        <div>

          ${
            invoice.paymentStatus !== "paid"
            ? `
              <button
                onclick="markInvoicePaid('${invoice._id}')"
              >
                💰
              </button>
            `
            : ""
          }

          <button
            class="delete"
            onclick="deleteInvoice('${invoice._id}')"
          >
            ❌
          </button>

        </div>

      </div>
    `;

    if (invoice.type === "quote") {

      quotesList.innerHTML += html;

    } else {

      invoiceList.innerHTML += html;
    }
  });
}

// CREATE INVOICE
async function createInvoice() {

  const contactId =
    document.getElementById("invoiceContact").value;

  const productId =
    document.getElementById("invoiceProduct").value;

  const quantity =
    document.getElementById("invoiceQuantity").value;

  const type =
    document.getElementById("invoiceType").value;

  const paymentMethod =
    document.getElementById("paymentMethod").value;

  if (!contactId || !productId) {

    showToast(
      "Contact et produit obligatoires ❗"
    );

    return;
  }

  showLoader();

  try {

    await apiFetch("/api/invoices", {

      method: "POST",

      body: JSON.stringify({

        type,
        contactId,
        paymentMethod,

        products: [
          {
            productId,
            quantity: Number(quantity)
          }
        ]
      })
    });

    await loadInvoices();

    await loadProducts();

    await loadInvoiceData();

    showToast("Document créé ✅");

  } catch (err) {

    console.error(err);

    showToast(
      err.message || "Erreur API"
    );

  } finally {

    hideLoader();
  }
}

// MARK PAID
async function markInvoicePaid(id) {

  try {

   await apiFetch(
  `/api/invoices/pay/${id}`,
      {
        method: "PUT"
      }
    );

    await loadInvoices();

    showToast(
      "Facture payée ✅"
    );

  } catch (err) {

    console.error(err);

    showToast(err.message);
  }
}

// DELETE INVOICE
async function deleteInvoice(id) {

  try {

    await apiFetch(
  `/api/invoices/${id}`,
      {
        method: "DELETE"
      }
    );

    await loadInvoices();

    showToast(
      "Document supprimé 🗑️"
    );

  } catch (err) {

    console.error(err);

    showToast(err.message);
  }
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
  `/api/contacts/favorite/${id}`,
    {
      method: "PUT"
    }
  );

  loadContacts();
}

async function deleteContact(id) {

 await apiFetch(
  `/api/contacts/${id}`,
    {
      method: "DELETE"
    }
  );

  loadContacts();

  loadInvoiceData();

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

await apiFetch("/api/contacts", {
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

  loadInvoiceData();

  hideLoader();

  showToast("Contact ajouté ✅");
}

// ================= ORDER TABS =================

function showOrderTab(tabId) {

  document
    .querySelectorAll(".order-tab")
    .forEach(tab => {

      tab.classList.remove("active");

    });

  document
    .getElementById(tabId)
    ?.classList.add("active");
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

async function loadAdminUsers() {

  try {

    const users =
      await apiFetch(
        "/api/admin/users"
      );

    document.getElementById(
      "totalUsers"
    ).innerText = users.length;

    const container =
      document.getElementById(
        "adminUsers"
      );

    container.innerHTML = "";

    users.forEach(user => {

      container.innerHTML += `

        <div style="
          background:#0f172a;

          padding:18px;

          border-radius:18px;

          margin-bottom:14px;

          border:1px solid rgba(255,255,255,0.06);
        ">

          <div style="
            color:white;
            font-size:16px;
            font-weight:700;
            margin-bottom:8px;
          ">
            ${user.email}
          </div>

          <div style="
            color:#94a3b8;
            font-size:14px;
            margin-bottom:6px;
          ">
            Role :
            ${user.role}
          </div>

          <div style="
            color:#94a3b8;
            font-size:14px;
            margin-bottom:6px;
          ">
            Vérifié :
            ${
              user.isVerified
                ? "✅ Oui"
                : "❌ Non"
            }
          </div>

          <div style="
            color:#94a3b8;
            font-size:14px;
          ">
            Inscription :
            ${new Date(
              user.createdAt
            ).toLocaleDateString()}
          </div>

        </div>
      `;
    });

  } catch (err) {

    console.error(err);

    alert("Erreur admin");
  }
}

function logoutAdmin() {

  localStorage.removeItem(
    "token"
  );

  window.location.href =
    "/admin-login";
  }

// ================= COMPANY =================

  async function loadCompany() {

  try {

    const res =
      await fetch(
        "/api/company"
      );

    const company =
      await res.json();
      
    document.getElementById(
      "companyName"
    ).value =
      company.companyName || "";

    document.getElementById(
      "companySiret"
    ).value =
      company.siret || "";

    document.getElementById(
      "companyVat"
    ).value =
      company.vatNumber || "";

    document.getElementById(
      "companyPhone"
    ).value =
      company.phone || "";

    document.getElementById(
      "companyEmail"
    ).value =
      company.email || "";

    document.getElementById(
      "companyWebsite"
    ).value =
      company.website || "";

    document.getElementById(
      "companyAddress"
    ).value =
      company.address || "";

    document.getElementById(
     "companyPostalCode"
    ).value =
      company.postalCode || "";

    document.getElementById(
      "companyCity"
    ).value =
      company.city || "";

    document.getElementById(
      "activityType"
    ).value =
      company.activityType || "Autre";

    document.getElementById(
      "quantityUnit"
    ).value =
      company.quantityUnit || "Pièce";

    document.getElementById(
      "customUnit"
    ).value =
      company.customUnit || "";

    document.getElementById(
      "companyRcs"
    ).value =
      company.rcs || "";

    document.getElementById(
      "companyApe"
    ).value =
      company.ape || "";

    document.getElementById(
      "companyIban"
    ).value =
     company.companyIban || "";

    document.getElementById(
      "companyBic"
    ).value =
     company.companyBic || "";

    document.getElementById(
      "companyBank"
    ).value =
     company.companyBank || "";

    document.getElementById(
      "companyAccountHolder"
    ).value =
     company.companyAccountHolder || "";

    document.getElementById(
      "currency"
    ).value =
      company.currency || "€";

    companyLogoBase64 =
      company.logo || "";
    
    document.getElementById(
      "logoPreview"
    ).src =
      company.logo || "";
      
  } catch (err) {

    console.error(err);
  }
}

  document.getElementById(
  "companyLogoSection"
).style.display = "none";

async function saveCompany() {

  try {

    await fetch(
      "/api/company",
      {
        method: "PUT",

        headers: {
          "Content-Type":
          "application/json"
        },

        body: JSON.stringify({

          companyName:
            document.getElementById(
              "companyName"
            ).value,

          siret:
            document.getElementById(
              "companySiret"
            ).value,

          vatNumber:
            document.getElementById(
              "companyVat"
            ).value,

          phone:
            document.getElementById(
              "companyPhone"
            ).value,

          email:
            document.getElementById(
              "companyEmail"
            ).value,

          website:
            document.getElementById(
              "companyWebsite"
            ).value,

          address:
            document.getElementById(
              "companyAddress"
            ).value,

          postalCode:
           document.getElementById(
             "companyPostalCode"
           ).value,

          city:
            document.getElementById(
              "companyCity"
           ).value,

          activityType:
            document.getElementById(
              "activityType"
            ).value,

          quantityUnit:
            document.getElementById(
              "quantityUnit"
            ).value,

          customUnit:
            document.getElementById(
              "customUnit"
            ).value,

          rcs:
            document.getElementById(
              "companyRcs"
            ).value,

          ape:
            document.getElementById(
              "companyApe"
            ).value,

          companyIban:
            document.getElementById(
              "companyIban"
            ).value,

          companyBic:
            document.getElementById(
              "companyBic"
            ).value,

          companyBank:
            document.getElementById(
              "companyBank"
            ).value,

          companyAccountHolder:
            document.getElementById(
              "companyAccountHolder"
            ).value,

          currency:
            document.getElementById(
              "currency"
            ).value,

          logo:
            companyLogoBase64

       })

      }
    );

    alert(
      "Entreprise enregistrée ✅"
    );

    document
  .querySelectorAll(".company-field")
  .forEach(field => {
    field.setAttribute(
      "readonly",
      true
    );
  });

    document.getElementById(
  "editCompanyBtn"
  ).style.display = "inline-flex";

    document.getElementById(
  "saveCompanyBtn"
  ).style.display = "none";

  } catch (err) {

    console.error(err);

    alert(
      "Erreur sauvegarde"
    );
  }
}

const logoInput =
  document.getElementById(
    "companyLogo"
  );

if (logoInput) {

  logoInput.addEventListener(
    "change",
    function (e) {

      const file =
        e.target.files[0];

      if (!file) return;

      const reader =
        new FileReader();

      reader.onload =
        function (event) {

          companyLogoBase64 =
            event.target.result;

          document.getElementById(
            "logoPreview"
          ).src =
            companyLogoBase64;
        };

      reader.readAsDataURL(file);
    }
  );
}

function enableCompanyEdit() {

  document
    .querySelectorAll(".company-field")
    .forEach(field => {
      field.removeAttribute("readonly");
    });

  document.getElementById(
    "companyLogoSection"
  ).style.display = "block";

  document.getElementById(
    "editCompanyBtn"
  ).style.display = "none";

  document.getElementById(
    "saveCompanyBtn"
  ).style.display = "inline-flex";
}
