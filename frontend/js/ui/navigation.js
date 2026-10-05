// Interface : navigation et contexte de travail.

const workspaceSections = {
  dashboard: ["Tableau de bord", "Pilotage de votre activité"],
  contacts: ["Clients", "Répertoire et suivi de vos contacts"],
  tasksSection: ["Agenda & tâches", "Vos actions et relances à traiter"],
  opportunitiesSection: ["Opportunités", "Votre pipeline commercial et vos prospects"],
  products: ["Produits", "Catalogue, tarifs et niveau de stock"],
  suppliersSection: ["Fournisseurs", "Répertoire de vos partenaires d'achat"],
  expensesSection: ["Achats & dépenses", "Suivi de vos frais et règlements fournisseurs"],
  treasurySection: ["Trésorerie", "Solde manuel et mouvements bancaires"],
  quotesSection: ["Devis", "Préparez et suivez vos propositions"],
  ordersSection: ["Commandes", "Suivi des commandes validées"],
  invoicesSection: ["Factures", "Encaissements et documents de vente"],
  company: ["Mon entreprise", "Profil et informations de facturation"],
  settings: ["Paramètres", "Compte, sécurité et données"]
};

function showSection(sectionId, event) {
  document.querySelectorAll(".section").forEach(element => element.classList.remove("active"));
  document.querySelectorAll(".sidebar button").forEach(button => button.classList.remove("active"));
  document.getElementById(sectionId)?.classList.add("active");

  const activeButton = event?.currentTarget || [...document.querySelectorAll(".sidebar nav button")]
    .find(button => button.getAttribute("onclick")?.includes(`'${sectionId}'`));
  activeButton?.classList.add("active");
  updateWorkspaceContext(sectionId);
  try { localStorage.setItem("my-prospect-active-section", sectionId); } catch (error) {}

  if (sectionId === "mapSection" && map) setTimeout(() => map.invalidateSize(), 200);
  if (sectionId === "analytics") loadAnalytics();
  if (sectionId === "company") loadCompany();
  if (sectionId === "settings") loadUserInfo();
  if (sectionId === "products") loadProducts();
  if (sectionId === "tasksSection") loadTasks?.();
  if (sectionId === "opportunitiesSection") loadOpportunities?.();
  if (sectionId === "suppliersSection") loadSuppliers?.();
  if (sectionId === "expensesSection") loadExpenses?.();
  if (sectionId === "treasurySection") loadTreasury?.();
  if (sectionId === "quotesSection") loadQuoteData();
  if (sectionId === "invoicesSection") {
    loadInvoices();
    loadInvoiceData();
  }
}

function updateWorkspaceContext(sectionId) {
  const [title, detail] = workspaceSections[sectionId] || ["My Prospect", "Espace de gestion"];
  const titleElement = document.getElementById("appContextTitle");
  const detailElement = document.getElementById("appContextDetail");
  if (titleElement) titleElement.textContent = title;
  if (detailElement) detailElement.textContent = detail;
}

function toggleSidebar() {
  const layout = document.querySelector(".app-layout");
  if (!layout) return;
  const collapsed = layout.classList.toggle("sidebar-collapsed");
  try { localStorage.setItem("my-prospect-sidebar-collapsed", String(collapsed)); } catch (error) {}
}
