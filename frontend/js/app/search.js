// app : search.

let globalSearchOpener = null;

function getGlobalSearchPresentation(query, results) {
  if (query.length < 2) {
    return {
      shouldSearch: false,
      countLabel: "Saisissez au moins 2 caractères",
      emptyMessage: "Retrouvez vos clients, produits, devis, commandes et factures sans quitter votre page.",
      items: []
    };
  }
  const labels = { contact: "Client", product: "Produit", document: "Document", opportunity: "Opportunité", task: "Agenda" };
  return {
    shouldSearch: true,
    countLabel: `${results.length} résultat${results.length > 1 ? "s" : ""}`,
    emptyMessage: "Aucun résultat. Essayez avec un nom, une référence ou un numéro de document.",
    items: results.map((result, index) => ({ ...result, index, kindLabel: labels[result.kind] }))
  };
}

function openGlobalSearch() {
  const modal = document.getElementById("globalSearchModal");
  const input = document.getElementById("globalSearchInput");
  if (!modal || !input) return;
  const activeElement = document.activeElement;
  if (activeElement?.focus && !modal.contains?.(activeElement)) globalSearchOpener = activeElement;
  modal.style.display = "flex";
  input.value = "";
  renderGlobalSearchResults();
  window.setTimeout(() => input.focus(), 40);
}

function closeGlobalSearch(restoreFocus = true) {
  const modal = document.getElementById("globalSearchModal");
  if (modal) modal.style.display = "none";
  if (restoreFocus) globalSearchOpener?.focus?.();
  globalSearchOpener = null;
}

function renderGlobalSearchResults() {
  const input = document.getElementById("globalSearchInput");
  const list = document.getElementById("globalSearchResults");
  const count = document.getElementById("globalSearchCount");
  if (!input || !list || !count) return;

  const query = input.value.trim().toLocaleLowerCase("fr-FR");
  let presentation = getGlobalSearchPresentation(query, []);
  if (!presentation.shouldSearch) {
    globalSearchResults = [];
    globalSearchSelectedIndex = -1;
    count.textContent = presentation.countLabel;
    list.innerHTML = `<p class="global-search-empty">${presentation.emptyMessage}</p>`;
    return;
  }

  globalSearchResults = findGlobalSearchResults(query, {
    contacts: typeof allContacts === "undefined" ? [] : allContacts,
    products: typeof allProducts === "undefined" ? [] : allProducts,
    documents: typeof allInvoices === "undefined" ? [] : allInvoices,
    opportunities: typeof allOpportunities === "undefined" ? [] : allOpportunities,
    tasks: typeof allTasks === "undefined" ? [] : allTasks
  });
  presentation = getGlobalSearchPresentation(query, globalSearchResults);
  globalSearchSelectedIndex = -1;
  count.textContent = presentation.countLabel;
  if (!presentation.items.length) {
    list.innerHTML = `<p class="global-search-empty">${presentation.emptyMessage}</p>`;
    return;
  }

  list.innerHTML = presentation.items.map(item => `<button type="button" class="global-search-result" data-global-search-result="${item.index}"><span class="global-search-result-type">${item.kindLabel}</span><span class="global-search-result-main"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span><span class="global-search-result-arrow">↗</span></button>`).join("");
  document.querySelectorAll("[data-global-search-result]").forEach(button => {
    button.addEventListener("click", () => openGlobalSearchResult(Number(button.dataset.globalSearchResult)));
  });
}

function openGlobalSearchResult(index) {
  const result = globalSearchResults[index];
  if (!result) return;
  closeGlobalSearch(false);
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
