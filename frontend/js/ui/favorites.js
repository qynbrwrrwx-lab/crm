// Interface : favoris et statistiques du compte.

async function loadFavorites() {
  const container = document.getElementById("favoritesList");
  if (!container) return;
  const contacts = await apiFetch("/api/contacts");
  const favorites = contacts.filter(contact => contact.favorite);
  container.innerHTML = favorites.map(contact => `
    <div class="client"><div>
      <strong>${escapeHtml(`${contact.firstname || ""} ${contact.lastname || ""}`.trim())}</strong><br>
      ${escapeHtml(contact.phone || "")}<br>
      ${escapeHtml(contact.companyName || "")}
    </div></div>
  `).join("");
}

async function loadUserInfo() {
  const contacts = await apiFetch("/api/contacts");
  const stats = document.getElementById("userStats");
  if (stats) stats.innerText = contacts.length;
}
