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
