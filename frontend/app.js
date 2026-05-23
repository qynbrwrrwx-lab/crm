const path = window.location.pathname;

if (path.includes("/reset-password/")) {

  document.body.innerHTML = `

  <div style="
    min-height:100vh;
    display:flex;
    justify-content:center;
    align-items:center;
    background:
      radial-gradient(circle at bottom,#155dfc 0%,#0f172a 45%,#020617 100%);
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
      padding:38px 34px;
      box-shadow:0 0 50px rgba(37,99,235,0.25);
      text-align:center;
   ">

      <img
  src="/logo.png"
  alt="My Prospect"
  style="
    width:450px;
    margin-bottom:8px;
    object-fit:contain;
    display:block;
    margin-left:auto;
    margin-right:auto;
  "
>
      >

      <h1 style="
        color:white;
        font-size:42px;
        line-height:1.05;
        margin:0 0 12px 0;
        font-weight:800;
    ">
        Nouveau mot<br>de passe
      </h1>

      <p style="
        color:#cbd5e1;
        font-size:15px;
        line-height:1.5;
        margin-bottom:28px;
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
    font-size:18px;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:0;
  "
>
  👁️
</button>

      </div>

      <button
        onclick="resetPassword()"
        style="
          width:100%;
          padding:18px;
          border:none;
          border-radius:16px;
          background:linear-gradient(90deg,#22d3ee,#2563eb);
          color:white;
          font-size:17px;
          font-weight:700;
          cursor:pointer;
          transition:0.3s;
          box-shadow:0 10px 30px rgba(37,99,235,0.35);
        "
      >
        Modifier le mot de passe
      </button>

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

// ================= GLOBAL =================
const API_URL = "https://my-prospect.com";
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
   } 

  // MAP
  if (sectionId === "mapSection" && map) {

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  

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