// Clients : rendu, chargement et contrôles de la liste.

function renderContacts(contacts) {
  const list = document.getElementById("list");
  list.innerHTML = "";
  if (!contacts.length) { list.innerHTML = '<p class="empty-state">Aucun contact ne correspond à votre recherche.</p>'; return; }
  contacts.forEach(contact => {
    const followUp = contact.nextFollowUpAt ? new Date(contact.nextFollowUpAt) : null;
    const overdue = followUp && followUp < new Date(new Date().setHours(0, 0, 0, 0));
    list.innerHTML += `<article class="client client-card"><div class="client-info"><div class="client-name-row"><strong>${escapeHtml(contact.firstname)} ${escapeHtml(contact.lastname)}</strong>${contact.favorite ? '<span class="client-favorite">Favori</span>' : ""}</div><div class="client-meta"><span>${escapeHtml(contact.companyName || "Client particulier")}</span><span>${escapeHtml(contact.email || "E-mail non renseigne")}</span><span>${escapeHtml(contact.phone || "Telephone non renseigne")}</span><span>${escapeHtml(contact.billingAddress || "Adresse non renseignee")}</span></div>${(contact.tags || []).length ? `<div class="client-tag-list">${contact.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}${followUp ? `<small class="client-follow-up ${overdue ? "is-overdue" : ""}">Relance : ${followUp.toLocaleDateString("fr-FR")}</small>` : ""}</div><div class="client-actions"><button class="client-action-btn client-view-btn" onclick="openClientProfile('${contact._id}')">Voir la fiche</button><button class="client-action-btn client-favorite-btn ${contact.favorite ? "is-favorite" : ""}" onclick="toggleFavorite('${contact._id}')">Favori</button><button class="client-action-btn" onclick="editContact('${contact._id}')">Modifier</button><button class="client-action-btn client-delete-btn" onclick="deleteContact('${contact._id}')">Supprimer</button></div></article>`;
  });
}

async function loadContacts() {
  const contacts = await apiFetch("/api/contacts");
  allContacts = contacts;
  taskContacts?.(); opportunityContacts?.(); updateKPI(contacts); updateClientFollowUpAlert?.(contacts); filterContacts(); updateChart(contacts);
  if (!map) return;
  markers.forEach(marker => map.removeLayer(marker)); markers = [];
  contacts.forEach(contact => { if (contact.lat && contact.lng) markers.push(L.marker([contact.lat, contact.lng]).addTo(map).bindPopup(`<b>${escapeHtml(contact.firstname || "")} ${escapeHtml(contact.lastname || "")}</b>`)); });
}

function ensureContactTagFilter() {
  const controls = document.querySelector(".list-toolbar-controls"); if (!controls) return;
  const tags = [...new Set(allContacts.flatMap(contact => contact.tags || []))].sort((left, right) => left.localeCompare(right, "fr-FR"));
  const current = document.getElementById("contactTagFilter")?.value || "all";
  let select = document.getElementById("contactTagFilter");
  if (!select) { select = document.createElement("select"); select.id = "contactTagFilter"; select.setAttribute("aria-label", "Filtrer les étiquettes clients"); select.onchange = filterContacts; controls.appendChild(select); }
  select.innerHTML = '<option value="all">Toutes les étiquettes</option>' + tags.map(tag => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`).join(""); select.value = tags.includes(current) ? current : "all"; select.hidden = !tags.length;
}

function filterContacts() {
  ensureContactTagFilter();
  const query = document.getElementById("search").value, sort = document.getElementById("contactSort")?.value || "recent", followUpFilter = document.getElementById("contactFollowUpFilter")?.value || "all", tagFilter = document.getElementById("contactTagFilter")?.value || "all", today = new Date();
  today.setHours(0, 0, 0, 0);
  const contacts = selectContacts(allContacts, { query, sort, followUpFilter, tagFilter, today });
  const count = document.getElementById("contactFilteredCount"), reset = document.getElementById("resetContactFilters");
  if (count) count.textContent = `${contacts.length} client${contacts.length > 1 ? "s" : ""} affiché${contacts.length > 1 ? "s" : ""}`;
  if (reset) reset.style.display = query.trim() || sort !== "recent" || followUpFilter !== "all" || tagFilter !== "all" ? "inline-flex" : "none";
  renderContacts(contacts);
}

function resetContactFilters() {
  const search = document.getElementById("search"), sort = document.getElementById("contactSort"), followUp = document.getElementById("contactFollowUpFilter"), tag = document.getElementById("contactTagFilter");
  if (search) search.value = ""; if (sort) sort.value = "recent"; if (followUp) followUp.value = "all"; if (tag) tag.value = "all";
  filterContacts(); search?.focus();
}
