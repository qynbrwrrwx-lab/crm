let editingContactId = null;
let allContacts = [];

// ================= ADD CONTACT =================

async function addContact() {

  const type =
    document.getElementById("type").value;

  const firstname =
    document.getElementById("firstname").value;

  const lastname =
    document.getElementById("lastname").value;

  const companyName =
    document.getElementById("contactCompany").value;

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

  let lat = null;
  let lng = null;

  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(billingAddress)}`
    );
    const geoData = geoRes.ok ? await geoRes.json() : [];

    if (geoData.length) {
      lat = parseFloat(geoData[0].lat);
      lng = parseFloat(geoData[0].lon);
    }
  } catch (geoError) {
    console.warn("Géolocalisation indisponible : contact enregistré sans coordonnées.");
  }

  try {
    await apiFetch(editingContactId ? `/api/contacts/${editingContactId}` : "/api/contacts", {
    method: editingContactId ? "PUT" : "POST",

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

  editingContactId = null;
  resetContactFormMode();

  loadContacts();

  loadInvoiceData();

    showToast("Contact enregistré ✅");
  } catch (err) {
    showToast(err.message || "Impossible d'enregistrer le contact");
  } finally {
    hideLoader();
  }
}

// ================= CONTACTS =================

function renderContacts(contacts) {

  const list =
    document.getElementById("list");

  list.innerHTML = "";

  if (!contacts.length) {
    list.innerHTML = '<p class="empty-state">Aucun contact ne correspond à votre recherche.</p>';
    return;
  }

  contacts.forEach(contact => {

    list.innerHTML += `

      <div class="client">

        <div class="client-info">

          <strong>

            ${escapeHtml(contact.firstname)}
            ${escapeHtml(contact.lastname)}

          </strong>

          ${contact.favorite ? "⭐" : ""}

          <br>

          ${escapeHtml(contact.companyName)}

          <br>

          ${escapeHtml(contact.email)}

          <br>

          ${escapeHtml(contact.phone)}

          <br>

          ${escapeHtml(contact.billingAddress)}

        </div>

        <div>

          <button
            onclick="toggleFavorite('${contact._id}')"
          >
            ⭐
          </button>

          <button onclick="editContact('${contact._id}')">Modifier</button>

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
  if (!window.confirm("Supprimer définitivement ce contact ?")) return;

  try {
    await apiFetch(`/api/contacts/${id}`, { method: "DELETE" });
    await loadContacts();
    await loadInvoiceData();
    showToast("Contact supprimé 🗑️");
  } catch (err) {
    showToast(err.message || "Impossible de supprimer ce contact");
  }
}

// ================= LOAD CONTACTS =================

async function loadContacts() {

  const contacts =
    await apiFetch("/api/contacts");

  allContacts = contacts;

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

function editContact(id) {
  const contact = allContacts.find(item => item._id === id);
  if (!contact) return;

  editingContactId = id;
  document.getElementById("contactFormTitle").textContent = "👥 Modifier le contact";
  document.getElementById("contactSubmitButton").textContent = "Enregistrer les modifications";
  document.getElementById("cancelContactEditButton").hidden = false;
  document.getElementById("type").value = contact.type || "particulier";
  document.getElementById("contactCompany").value = contact.companyName || "";
  document.getElementById("firstname").value = contact.firstname || "";
  document.getElementById("lastname").value = contact.lastname || "";
  document.getElementById("siret").value = contact.siret || "";
  document.getElementById("emailContact").value = contact.email || "";
  document.getElementById("phone").value = contact.phone || "";
  document.getElementById("billingAddress").value = contact.billingAddress || "";
  document.getElementById("shippingAddress").value = contact.shippingAddress || "";
  document.getElementById("notes").value = contact.notes || "";
  showToast("Modifiez le contact puis enregistrez-le");
}

function resetContactFormMode() {
  document.getElementById("contactFormTitle").textContent = "👥 Ajouter contact";
  document.getElementById("contactSubmitButton").textContent = "Ajouter contact";
  document.getElementById("cancelContactEditButton").hidden = true;
}

function cancelContactEdit() {
  editingContactId = null;
  ["firstname", "lastname", "contactCompany", "siret", "emailContact", "phone", "billingAddress", "shippingAddress", "notes"]
    .forEach(id => { document.getElementById(id).value = ""; });
  document.getElementById("type").value = "particulier";
  resetContactFormMode();
  showToast("Modification annulée");
}

// ================= FILTER CONTACTS =================

function filterContacts() {

  const query =
    document.getElementById("search").value.trim().toLocaleLowerCase("fr-FR");

  const filteredContacts = !query
    ? allContacts
    : allContacts.filter(contact => [
      contact.firstname,
      contact.lastname,
      contact.companyName,
      contact.email,
      contact.phone,
      contact.siret
    ].some(value => String(value || "").toLocaleLowerCase("fr-FR").includes(query)));

  const sort = document.getElementById("contactSort")?.value || "recent";
  const sortedContacts = [...filteredContacts].sort((left, right) => {
    if (sort === "favorite") return Number(right.favorite) - Number(left.favorite);

    if (sort === "name") {
      const leftName = `${left.lastname || ""} ${left.firstname || ""}`;
      const rightName = `${right.lastname || ""} ${right.firstname || ""}`;
      return leftName.localeCompare(rightName, "fr-FR");
    }

    if (sort === "company") {
      return String(left.companyName || "").localeCompare(
        String(right.companyName || ""),
        "fr-FR"
      );
    }

    return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
  });

  renderContacts(sortedContacts);
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


