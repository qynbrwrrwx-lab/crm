// Interface : favoris et statistiques du compte.

function getFavoriteContactPresentation(contact) {
  return {
    fullName: `${contact.firstname || ""} ${contact.lastname || ""}`.trim(),
    phone: contact.phone || "",
    companyName: contact.companyName || ""
  };
}

function renderFavoriteContact(contact) {
  const item = getFavoriteContactPresentation(contact);
  return `<div class="client"><div>
    <strong>${escapeHtml(item.fullName)}</strong><br>
    ${escapeHtml(item.phone)}<br>
    ${escapeHtml(item.companyName)}
  </div></div>`;
}

async function loadFavorites() {
  const container = document.getElementById("favoritesList");
  if (!container) return;
  const contacts = await apiFetch("/api/contacts");
  const favorites = contacts.filter(contact => contact.favorite);
  container.innerHTML = favorites.map(renderFavoriteContact).join("");
}

async function loadUserInfo() {
  const contacts = await apiFetch("/api/contacts");
  const stats = document.getElementById("userStats");
  if (stats) stats.innerText = contacts.length;
}
