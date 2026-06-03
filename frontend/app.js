console.log("APP JS CHARGE");

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

  if (sectionId === "quotesSection") {

  console.log("QUOTES OPEN");
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

async function loadQuoteData() {

  console.log("LOAD QUOTE DATA EXECUTE");

  const contacts =
    await apiFetch("/api/contacts");

    console.log("CONTACTS =", contacts);

  const products =
    await apiFetch("/api/products");

    console.log("PRODUCTS =", products);

  const contactSelect =
    document.getElementById("quoteContact");

  const productSelect =
    document.getElementById("quoteProduct");

  if (!contactSelect || !productSelect) return;

  contactSelect.innerHTML =
    '<option value="">Sélectionner un contact</option>';

 contacts.forEach(contact => {

    contactSelect.innerHTML += `
      <option value="${contact._id}">
        ${contact.firstname || ""}
        ${contact.lastname || ""}
      </option>
    `;
  });

  productSelect.innerHTML =
    '<option value="">Sélectionner un produit</option>';

  products.forEach(product => {

    productSelect.innerHTML += `
      <option value="${product._id}">
        ${product.name}
      </option>
    `;
  });
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
   
   const logoPreview =
    document.getElementById(
    "logoPreview"
   );

   if (logoPreview) {
      logoPreview.src =
    company.logo || "";
    }

  const headerLogo =
    document.getElementById(
    "headerLogo"
   );

   if (headerLogo) {
      headerLogo.src =
    company.logo || "";
    }

    document.getElementById(
      "companyForm"
    ).style.display = "grid";

    document.getElementById(
     "companyLogoSection"
    ).style.display = "none";

    document.getElementById(
     "editCompanyBtn"
    ).style.display = "inline-flex";

    document.getElementById(
     "saveCompanyBtn"
    ).style.display = "none";

    document
      .querySelectorAll(".company-field")
      .forEach(field => {
        field.setAttribute(
         "readonly",
       true
     );
   });

  } catch (err) {
 
    console.error(err);

  }
}

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
      "Modifications effectuées ✅"
    );

    document
  .querySelectorAll(".company-field")
  .forEach(field => {

    field.setAttribute(
      "readonly",
      true
    );

    if (
      field.tagName === "SELECT"
    ) {
      field.disabled = true;
    }

  });

    document.getElementById(
  "companyLogoSection"
  ).style.display = "none";

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

    const headerLogo =
      document.getElementById(
        "headerLogo"
      );

    if (headerLogo) {
      headerLogo.src =
        companyLogoBase64;
    }
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

      if (
        field.tagName === "SELECT"
      ) {
        field.disabled = false;
      }

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

async function toggleQuoteForm() {

  const form =
    document.getElementById("quoteForm");

  if (!form) return;

  const opening =
    form.style.display === "none";

  form.style.display =
    opening ? "block" : "none";

  if (opening) {

    console.log("QUOTES OPEN");

    await loadQuoteData();

  }
}

async function createQuote() {

  const contactId =
    document.getElementById("quoteContact").value;

  const productId =
    document.getElementById("quoteProduct").value;

  const quantity =
    parseInt(
      document.getElementById("quoteQuantity").value
    );

  if (!contactId) {
    return showToast("Sélectionnez un contact");
  }

  if (!productId) {
    return showToast("Sélectionnez un produit");
  }

  try {

    await apiFetch("/api/quotes", {

      method: "POST",

      body: JSON.stringify({
        contactId,
        productId,
        quantity
      })

    });

    showToast("Devis créé ✅");

    loadQuotes();

  } catch (err) {

    console.error(err);

    showToast(err.message);

  }

}
