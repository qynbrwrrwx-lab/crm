// Tableau de bord : charts.

function getContactCreationCounts(contacts) {
  return contacts.reduce((counts, contact) => {
    const date = contact.createdAt
      ? new Date(contact.createdAt).toLocaleDateString()
      : "Unknown";
    counts[date] = (counts[date] || 0) + 1;
    return counts;
  }, {});
}

function updateChart(contacts) {
  const ctx = document.getElementById("chart");
  if (!ctx) return;
  const counts = getContactCreationCounts(contacts);

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

function getRevenuePeriodBuckets(period, today = new Date()) {
  const labels = [];
  const buckets = new Map();
  const count = period === "week" ? 7 : period === "year" ? 12 : 6;

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    if (period === "week") date.setDate(today.getDate() - offset);
    else date.setMonth(today.getMonth() - offset, 1);
    const key = period === "week"
      ? date.toISOString().slice(0, 10)
      : `${date.getFullYear()}-${date.getMonth()}`;
    labels.push(period === "week"
      ? date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })
      : date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }));
    buckets.set(key, 0);
  }
  return { labels, buckets };
}

function getRevenueChartSeries(invoices, period, today = new Date()) {
  const { labels, buckets } = getRevenuePeriodBuckets(period, today);
  invoices.forEach(invoice => {
    const paidAt = new Date(invoice.paidAt || invoice.updatedAt || invoice.createdAt);
    const key = period === "week"
      ? paidAt.toISOString().slice(0, 10)
      : `${paidAt.getFullYear()}-${paidAt.getMonth()}`;
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + Number(invoice.totalTTC || 0));
  });
  return { labels, points: [...buckets.values()] };
}

function getRevenueChartOptions(labels, points) {
  return {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Encaissements TTC",
        data: points,
        borderColor: "#34d399",
        backgroundColor: "rgba(52, 211, 153, .14)",
        fill: true,
        tension: .35,
        pointRadius: 3,
        pointBackgroundColor: "#a7f3d0"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
        y: { beginAtZero: true, grid: { color: "rgba(148,163,184,.12)" }, ticks: { color: "#94a3b8", callback: value => `${value} €` } }
      }
    }
  };
}

function refreshDashboardPerformance() {
  const canvas = document.getElementById("revenueChart");
  const period = document.getElementById("dashboardPeriod")?.value || "month";
  if (!canvas || typeof Chart === "undefined") return;
  const { labels, points } = getRevenueChartSeries(dashboardPaidInvoices, period);

  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart(canvas, getRevenueChartOptions(labels, points));
}

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
