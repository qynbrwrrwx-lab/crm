// Clients : rendu, chargement et contrôles de la liste.

function getContactFollowUp(contact) {
  if (!contact.nextFollowUpAt) return null;

  const date = new Date(contact.nextFollowUpAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { date, overdue: date < today };
}

function renderContactTags(tags) {
  if (!tags?.length) return "";
  return `<div class="client-tag-list">${tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`;
}

function renderContactFollowUp(followUp) {
  if (!followUp) return "";
  return `<small class="client-follow-up ${followUp.overdue ? "is-overdue" : ""}">Relance : ${followUp.date.toLocaleDateString("fr-FR")}</small>`;
}

function getContactCardPresentation(contact) {
  return {
    fullName: `${contact.firstname || ""} ${contact.lastname || ""}`.trim(),
    companyName: contact.companyName || "Client particulier",
    email: contact.email || "E-mail non renseigne",
    phone: contact.phone || "Telephone non renseigne",
    billingAddress: contact.billingAddress || "Adresse non renseignee",
    followUp: getContactFollowUp(contact),
    favorite: Boolean(contact.favorite),
    tags: contact.tags || []
  };
}

function renderContactCard(contact) {
  const presentation = getContactCardPresentation(contact);
  const favorite = presentation.favorite ? '<span class="client-favorite">Favori</span>' : "";
  const tags = renderContactTags(presentation.tags);
  return `<article class="client client-card"><div class="client-info"><div class="client-name-row"><strong>${escapeHtml(presentation.fullName)}</strong>${favorite}</div><div class="client-meta"><span>${escapeHtml(presentation.companyName)}</span><span>${escapeHtml(presentation.email)}</span><span>${escapeHtml(presentation.phone)}</span><span>${escapeHtml(presentation.billingAddress)}</span></div>${tags}${renderContactFollowUp(presentation.followUp)}</div><div class="client-actions"><button class="client-action-btn client-view-btn" onclick="openClientProfile('${contact._id}')">Voir la fiche</button><button class="client-action-btn client-favorite-btn ${presentation.favorite ? "is-favorite" : ""}" onclick="toggleFavorite('${contact._id}')">Favori</button><button class="client-action-btn" onclick="editContact('${contact._id}')">Modifier</button><button class="client-action-btn client-delete-btn" onclick="deleteContact('${contact._id}')">Supprimer</button></div></article>`;
}

function renderContacts(contacts) {
  const list = document.getElementById("list");
  if (!list) return;

  list.innerHTML = contacts.length
    ? contacts.map(renderContactCard).join("")
    : '<p class="empty-state">Aucun contact ne correspond à votre recherche.</p>';
}

function renderContactMap(contacts) {
  if (!map) return;

  markers.forEach(marker => map.removeLayer(marker));
  markers = [];
  contacts.forEach(contact => {
    if (!contact.lat || !contact.lng) return;
    const name = `${escapeHtml(contact.firstname || "")} ${escapeHtml(contact.lastname || "")}`;
    markers.push(L.marker([contact.lat, contact.lng]).addTo(map).bindPopup(`<b>${name}</b>`));
  });
}

async function loadContacts() {
  const contacts = await apiFetch("/api/contacts");
  allContacts = contacts;
  taskContacts?.();
  opportunityContacts?.();
  updateKPI(contacts);
  updateClientFollowUpAlert?.(contacts);
  filterContacts();
  updateChart(contacts);
  renderContactMap(contacts);
}

function getContactTags(contacts) {
  return [...new Set(contacts.flatMap(contact => contact.tags || []))]
    .sort((left, right) => left.localeCompare(right, "fr-FR"));
}

function ensureContactTagFilter() {
  const controls = document.querySelector(".list-toolbar-controls");
  if (!controls) return;

  const tags = getContactTags(allContacts);
  const current = document.getElementById("contactTagFilter")?.value || "all";
  let select = document.getElementById("contactTagFilter");
  if (!select) {
    select = document.createElement("select");
    select.id = "contactTagFilter";
    select.setAttribute("aria-label", "Filtrer les étiquettes clients");
    select.onchange = filterContacts;
    controls.appendChild(select);
  }
  select.innerHTML = '<option value="all">Toutes les étiquettes</option>' + tags.map(tag => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`).join("");
  select.value = tags.includes(current) ? current : "all";
  select.hidden = !tags.length;
}

function getContactFilterState() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return {
    query: document.getElementById("search").value,
    sort: document.getElementById("contactSort")?.value || "recent",
    followUpFilter: document.getElementById("contactFollowUpFilter")?.value || "all",
    tagFilter: document.getElementById("contactTagFilter")?.value || "all",
    today
  };
}

function getContactFilterStatusPresentation(contacts, filters) {
  const hasActiveFilter = filters.query.trim() || filters.sort !== "recent" || filters.followUpFilter !== "all" || filters.tagFilter !== "all";
  return {
    countLabel: `${contacts.length} client${contacts.length > 1 ? "s" : ""} affiché${contacts.length > 1 ? "s" : ""}`,
    resetHidden: !hasActiveFilter
  };
}

function updateContactFilterStatus(contacts, filters) {
  const count = document.getElementById("contactFilteredCount");
  const reset = document.getElementById("resetContactFilters");
  const presentation = getContactFilterStatusPresentation(contacts, filters);
  if (count) count.textContent = presentation.countLabel;
  if (reset) reset.hidden = presentation.resetHidden;
}

function filterContacts() {
  ensureContactTagFilter();
  const filters = getContactFilterState();
  const contacts = selectContacts(allContacts, filters);
  updateContactFilterStatus(contacts, filters);
  renderContacts(contacts);
}

function resetContactFilters() {
  const search = document.getElementById("search");
  const sort = document.getElementById("contactSort");
  const followUp = document.getElementById("contactFollowUpFilter");
  const tag = document.getElementById("contactTagFilter");
  if (search) search.value = "";
  if (sort) sort.value = "recent";
  if (followUp) followUp.value = "all";
  if (tag) tag.value = "all";
  filterContacts();
  search?.focus();
}
