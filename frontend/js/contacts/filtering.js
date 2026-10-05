// Clients : recherche, filtres et tris de la liste.

function selectContacts(contacts, { query, sort, followUpFilter, tagFilter, today }) {
  const normalizedQuery = query.trim().toLocaleLowerCase("fr-FR");
  const searched = !normalizedQuery ? contacts : contacts.filter(contact => [contact.firstname, contact.lastname, contact.companyName, contact.email, contact.phone, contact.siret, ...(contact.tags || [])].some(value => String(value || "").toLocaleLowerCase("fr-FR").includes(normalizedQuery)));
  const filtered = searched.filter(contact => {
    if (tagFilter !== "all" && !(contact.tags || []).includes(tagFilter)) return false;
    if (followUpFilter === "none") return !contact.nextFollowUpAt;
    if (!contact.nextFollowUpAt) return followUpFilter === "all";
    const followUpDate = new Date(contact.nextFollowUpAt);
    if (followUpFilter === "due") return followUpDate <= today;
    return followUpFilter !== "planned" || followUpDate > today;
  });
  return [...filtered].sort((left, right) => {
    if (sort === "favorite") return Number(right.favorite) - Number(left.favorite);
    if (sort === "follow-up") return (left.nextFollowUpAt ? new Date(left.nextFollowUpAt).getTime() : Number.MAX_SAFE_INTEGER) - (right.nextFollowUpAt ? new Date(right.nextFollowUpAt).getTime() : Number.MAX_SAFE_INTEGER);
    if (sort === "name") return `${left.lastname || ""} ${left.firstname || ""}`.localeCompare(`${right.lastname || ""} ${right.firstname || ""}`, "fr-FR");
    if (sort === "company") return String(left.companyName || "").localeCompare(String(right.companyName || ""), "fr-FR");
    return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
  });
}
