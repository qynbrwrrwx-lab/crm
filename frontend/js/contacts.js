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

  console.log("TOKEN AVANT CONTACT =", getToken());

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

  document.getElementById("contactCompany").value = "";

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

// ================= DELETE CONTACT =================

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

// ================= LOAD CONTACTS =================

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

// ================= FILTER CONTACTS =================

function filterContacts() {

  const query =
    document.getElementById("search").value;

  loadContacts(
    query
      ? `search=${encodeURIComponent(query)}`
      : ""
  );
}

// ================= TOOGLE FAVORITES =================

async function toggleFavorite(id) {

  await apiFetch(
  `/api/contacts/favorite/${id}`,
    {
      method: "PUT"
    }
  );

  loadContacts();
}


