// Interface : démarrage de l'espace de travail.

function showApp() {
  const auth = document.getElementById("auth");
  const app = document.getElementById("app");
  if (auth) auth.style.display = "none";
  if (app) app.style.display = "block";

  initMap();
  loadContacts().catch(console.error);
  loadTasks?.().catch(console.error);
  loadOpportunities?.().catch(console.error);
  loadProducts().catch(console.error);
  loadSuppliers?.().catch(console.error);
  loadExpenses?.().catch(console.error);
  loadExpenseBudgets?.().catch(console.error);
  loadTreasury?.().catch(console.error);
  loadInvoices().catch(console.error);
  loadInvoiceData().catch(console.error);
  loadCompanySetupStatus?.().catch(console.error);
  loadOnboardingChecklist?.().catch(console.error);
  loadAccountActivity?.().catch(console.error);
}
