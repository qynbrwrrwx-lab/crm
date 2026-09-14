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

  updateCommercialInsights(invoices, paid);
}

function updateCommercialInsights(documents, paidInvoices) {
  const now = new Date();
  const monthPaidInvoices = paidInvoices.filter(invoice => {
    const date = new Date(invoice.paidAt || invoice.updatedAt || invoice.createdAt);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  const monthlyRevenue = monthPaidInvoices.reduce(
    (total, invoice) => total + Number(invoice.totalTTC || 0),
    0
  );
  const revenue = document.getElementById("dashboardMonthlyRevenue");
  const revenueDetail = document.getElementById("dashboardMonthlyRevenueDetail");
  if (revenue) revenue.textContent = `${monthlyRevenue.toFixed(2)} €`;
  if (revenueDetail) {
    revenueDetail.textContent = monthPaidInvoices.length
      ? `${monthPaidInvoices.length} facture${monthPaidInvoices.length > 1 ? "s" : ""} réglée${monthPaidInvoices.length > 1 ? "s" : ""} ce mois-ci.`
      : "Aucune facture réglée ce mois-ci.";
  }

  const sales = new Map();
  documents
    .filter(document => document.type === "order")
    .forEach(order => {
      (order.products || []).forEach(line => {
        const name = line.productName || "Produit sans nom";
        sales.set(name, (sales.get(name) || 0) + Number(line.quantity || 0));
      });
    });

  const bestSellers = [...sales.entries()]
    .sort(([, left], [, right]) => right - left)
    .slice(0, 3);
  const container = document.getElementById("dashboardBestSellers");
  if (!container) return;
  container.innerHTML = bestSellers.length
    ? bestSellers.map(([name, quantity], index) => `
        <div class="best-seller-row">
          <span class="best-seller-rank">${index + 1}</span>
          <strong>${escapeHtml(name)}</strong>
          <span>${quantity} unité${quantity > 1 ? "s" : ""}</span>
        </div>
      `).join("")
    : '<p class="empty-state">Pas encore de vente enregistrée.</p>';
}

function updateStockKPI(products) {
  const lowStock = products.filter(
    product => Number(product.stock || 0) <= Number(product.lowStockThreshold ?? 5)
  ).length;
  const outOfStock = products.filter(product => Number(product.stock || 0) === 0).length;
  const stockValue = products.reduce(
    (total, product) => total + Number(product.stock || 0) * Number(product.priceHT || 0),
    0
  );

  const element = document.getElementById("dashboardLowStock");
  if (element) element.innerText = lowStock;
  const outOfStockElement = document.getElementById("dashboardOutOfStock");
  if (outOfStockElement) outOfStockElement.innerText = outOfStock;
  const valueElement = document.getElementById("dashboardStockValue");
  if (valueElement) valueElement.innerText = `${stockValue.toFixed(2)} €`;
  const countElement = document.getElementById("dashboardProductCount");
  if (countElement) countElement.innerText = products.length;
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
