// app : search.

function openGlobalSearch() {
  const modal = document.getElementById("globalSearchModal");
  const input = document.getElementById("globalSearchInput");
  if (!modal || !input) return;
  modal.style.display = "flex";
  input.value = "";
  renderGlobalSearchResults();
  window.setTimeout(() => input.focus(), 40);
}

function closeGlobalSearch() {
  const modal = document.getElementById("globalSearchModal");
  if (modal) modal.style.display = "none";
}

function renderGlobalSearchResults() {
  const input = document.getElementById("globalSearchInput");
  const list = document.getElementById("globalSearchResults");
  const count = document.getElementById("globalSearchCount");
  if (!input || !list || !count) return;

  const query = input.value.trim().toLocaleLowerCase("fr-FR");
  if (query.length < 2) {
    globalSearchResults = [];
    globalSearchSelectedIndex = -1;
    count.textContent = "Saisissez au moins 2 caractères";
    list.innerHTML = '<p class="global-search-empty">Retrouvez vos clients, produits, devis, commandes et factures sans quitter votre page.</p>';
    return;
  }

  globalSearchResults = findGlobalSearchResults(query, {
    contacts: typeof allContacts === "undefined" ? [] : allContacts,
    products: typeof allProducts === "undefined" ? [] : allProducts,
    documents: typeof allInvoices === "undefined" ? [] : allInvoices,
    opportunities: typeof allOpportunities === "undefined" ? [] : allOpportunities,
    tasks: typeof allTasks === "undefined" ? [] : allTasks
  });
  globalSearchSelectedIndex = -1;
  count.textContent = `${globalSearchResults.length} résultat${globalSearchResults.length > 1 ? "s" : ""}`;
  if (!globalSearchResults.length) {
    list.innerHTML = '<p class="global-search-empty">Aucun résultat. Essayez avec un nom, une référence ou un numéro de document.</p>';
    return;
  }

  const labels = { contact: "Client", product: "Produit", document: "Document", opportunity: "Opportunité", task: "Agenda" };
  list.innerHTML = globalSearchResults.map((result, index) => `<button type="button" class="global-search-result" onclick="openGlobalSearchResult(${index})"><span class="global-search-result-type">${labels[result.kind]}</span><span class="global-search-result-main"><strong>${escapeHtml(result.title)}</strong><small>${escapeHtml(result.detail)}</small></span><span class="global-search-result-arrow">↗</span></button>`).join("");
}

function openGlobalSearchResult(index) {
  const result = globalSearchResults[index];
  if (!result) return;
  closeGlobalSearch();
  if (result.kind === "contact") openClientProfile(result.id);
  if (result.kind === "product") openRestockModal(result.id);
  if (result.kind === "document") openInvoice(result.id);
  if (result.kind === "opportunity") { showSection("opportunitiesSection"); editOpportunity(result.id); }
  if (result.kind === "task") { showSection("tasksSection"); editTask(result.id); }
}

function setGlobalSearchSelection(index) {
  globalSearchSelectedIndex = index;
  document.querySelectorAll(".global-search-result").forEach((button, buttonIndex) => {
    button.classList.toggle("is-selected", buttonIndex === index);
  });
  document.querySelectorAll(".global-search-result")[index]?.scrollIntoView({ block: "nearest" });
}

document.addEventListener("keydown", event => {
  const paletteOpen = document.getElementById("globalSearchModal")?.style.display === "flex";
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openGlobalSearch();
    return;
  }
  if (!paletteOpen) return;
  if (event.key === "Escape") {
    closeGlobalSearch();
    return;
  }
  if (event.key === "ArrowDown" && globalSearchResults.length) {
    event.preventDefault();
    setGlobalSearchSelection((globalSearchSelectedIndex + 1) % globalSearchResults.length);
  }
  if (event.key === "ArrowUp" && globalSearchResults.length) {
    event.preventDefault();
    setGlobalSearchSelection((globalSearchSelectedIndex - 1 + globalSearchResults.length) % globalSearchResults.length);
  }
  if (event.key === "Enter" && globalSearchResults.length) {
    event.preventDefault();
    openGlobalSearchResult(globalSearchSelectedIndex >= 0 ? globalSearchSelectedIndex : 0);
  }
});
