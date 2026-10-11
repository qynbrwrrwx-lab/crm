// Tableau de bord : onboarding.

function getOnboardingPresentation(company, contacts, products, documents) {
  const companyReady = [
    company.companyName,
    company.siret,
    company.email,
    company.address,
    company.city
  ].every(value => String(value || "").trim());
  const steps = [
    { done: companyReady, label: "Completer mon entreprise", description: "Coordonnees et informations legales pour vos documents.", section: "company" },
    { done: contacts.length > 0, label: "Ajouter un premier contact", description: "Enregistrez votre premier client ou prospect.", section: "contacts" },
    { done: products.length > 0, label: "Ajouter un produit ou service", description: "Constituez votre catalogue et vos tarifs.", section: "products" },
    { done: documents.some(document => document.type === "quote"), label: "Creer mon premier devis", description: "Transformez ensuite le devis accepte en commande puis facture.", section: "quotesSection" }
  ].map((step, index) => ({ ...step, stepNumber: index + 1 }));
  const completed = steps.filter(step => step.done).length;
  return { steps, completed, progressLabel: `${completed}/${steps.length}` };
}

async function loadOnboardingChecklist() {
  const container = document.getElementById("onboardingChecklist");
  const stepsContainer = document.getElementById("onboardingSteps");
  const progress = document.getElementById("onboardingProgress");
  if (!container || !stepsContainer || !progress) return;

  try {
    const [company, contacts, products, documents] = await Promise.all([
      apiFetch("/api/company"),
      apiFetch("/api/contacts"),
      apiFetch("/api/products"),
      apiFetch("/api/invoices")
    ]);

    const { steps, completed, progressLabel } = getOnboardingPresentation(company, contacts, products, documents);
    container.hidden = completed === steps.length;
    progress.textContent = progressLabel;
    const workspace = document.querySelector("#dashboard .dashboard-workspace");
    if (!container.hidden && workspace && container.previousElementSibling !== workspace) {
      workspace.before(container);
    }
    stepsContainer.innerHTML = steps.map(step => `
      <button
        type="button"
        class="onboarding-step ${step.done ? "done" : ""}"
        onclick="startOnboardingStep('${step.section}')"
      >
        <span class="onboarding-check">${step.done ? "OK" : step.stepNumber}</span>
        <span>
          <strong>${step.label}</strong>
          <small>${step.description}</small>
        </span>
      </button>
    `).join("");
  } catch (err) {
    container.hidden = true;
  }
}

function startOnboardingStep(section) {
  const actions = {
    company: () => showSection("company"),
    contacts: () => startContactFromDashboard(),
    products: () => startProductFromDashboard(),
    quotesSection: () => startQuoteFromDashboard()
  };
  (actions[section] || (() => showSection(section)))();
}
