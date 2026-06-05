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

// ================= SHOW APP =================

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
    loadQuotesData();
  }

  // INVOICES
  if (sectionId === "invoicesSection") {

    loadInvoices();

    loadInvoiceData();
  }
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

// ================= LOAD USER INFO =================

async function loadUserInfo() {

  const contacts =
  await apiFetch("/api/contacts");

  document.getElementById("userStats")
    .innerText = contacts.length;
}