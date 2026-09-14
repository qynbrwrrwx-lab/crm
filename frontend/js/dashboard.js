// ================= DASHBOARD =================

function updateChart(contacts) {

  const ctx =
    document.getElementById("chart");

  if (!ctx) return;

  const counts = {};

  contacts.forEach(contact => {

    const date = contact.createdAt
      ? new Date(contact.createdAt)
          .toLocaleDateString()
      : "Unknown";

    counts[date] =
      (counts[date] || 0) + 1;
  });

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {

    type: "line",

    data: {

      labels: Object.keys(counts),

      datasets: [{
        label: "Nouveaux contacts",

        data: Object.values(counts),

        fill: true
      }]
    }
  });
}

// ================= KPI =================

function updateKPI(contacts) {

  document.getElementById("total")
    .innerText = contacts.length;

}

function updateBusinessKPI(invoices) {
  const quotes = invoices.filter(
    invoice => invoice.type === "quote" && invoice.status !== "accepted"
  );
  const orders = invoices.filter(invoice => invoice.type === "order");
  const pending = invoices.filter(
    invoice => invoice.type === "invoice" && invoice.paymentStatus !== "paid"
  );
  const paid = invoices.filter(
    invoice => invoice.type === "invoice" && invoice.paymentStatus === "paid"
  );

  document.getElementById("dashboardQuotes").innerText = quotes.length;
  document.getElementById("dashboardOrders").innerText = orders.length;
  document.getElementById("dashboardPendingInvoices").innerText = pending.length;
  document.getElementById("dashboardPendingTotal").innerText =
    `${pending.reduce((total, invoice) => total + Number(invoice.totalTTC || 0), 0).toFixed(2)} €`;
  document.getElementById("dashboardPaidTotal").innerText =
    `${paid.reduce((total, invoice) => total + Number(invoice.totalTTC || 0), 0).toFixed(2)} €`;
}

function updateStockKPI(products) {
  const lowStock = products.filter(
    product => Number(product.stock || 0) <= 5
  ).length;

  const element = document.getElementById("dashboardLowStock");
  if (element) element.innerText = lowStock;
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

    const companyReady = [
      company.companyName,
      company.siret,
      company.email,
      company.address,
      company.city
    ].every(value => String(value || "").trim());

    const steps = [
      {
        done: companyReady,
        label: "Completer mon entreprise",
        description: "Coordonnees et informations legales pour vos documents.",
        section: "company"
      },
      {
        done: contacts.length > 0,
        label: "Ajouter un premier contact",
        description: "Enregistrez votre premier client ou prospect.",
        section: "contacts"
      },
      {
        done: products.length > 0,
        label: "Ajouter un produit ou service",
        description: "Constituez votre catalogue et vos tarifs.",
        section: "products"
      },
      {
        done: documents.some(document => document.type === "quote"),
        label: "Creer mon premier devis",
        description: "Transformez ensuite le devis accepte en commande puis facture.",
        section: "quotesSection"
      }
    ];

    const completed = steps.filter(step => step.done).length;
    container.hidden = completed === steps.length;
    progress.textContent = `${completed}/${steps.length}`;
    stepsContainer.innerHTML = steps.map(step => `
      <button
        type="button"
        class="onboarding-step ${step.done ? "done" : ""}"
        onclick="showSection('${step.section}')"
      >
        <span class="onboarding-check">${step.done ? "OK" : String(steps.indexOf(step) + 1)}</span>
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

// ================= ANALYTICS =================

async function loadAnalytics() {

 const contacts =
  await apiFetch("/api/contacts");

  const ctx =
    document.getElementById("analyticsChart");

  const favorites =
    contacts.filter(c => c.favorite).length;

  if (analyticsChart) {
    analyticsChart.destroy();
  }

  analyticsChart = new Chart(ctx, {

    type: "doughnut",

    data: {

      labels: [
        "Favoris",
        "Autres"
      ],

      datasets: [{
        data: [
          favorites,
          contacts.length - favorites
        ]
      }]
    }
  });
}
