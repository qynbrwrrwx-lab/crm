// État partagé des clients et normalisation des étiquettes.
let editingContactId = null;
let allContacts = [];

function normalizeContactTags(value) {
  return [...new Set(String(value || "").split(",")
    .map(tag => tag.trim().replace(/\s+/g, " "))
    .filter(tag => tag && tag.length <= 32))]
    .slice(0, 10);
}
