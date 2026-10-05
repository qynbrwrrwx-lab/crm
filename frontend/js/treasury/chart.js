// Trésorerie : chart.

function renderTreasuryChart() {
  const canvas = document.getElementById("treasuryChart");
  if (!canvas || typeof Chart === "undefined") return;
  const { labels, income, expense } = getTreasuryChartData(treasuryEntries);
  if (treasuryChart) treasuryChart.destroy();
  treasuryChart = new Chart(canvas, { type: "bar", data: { labels, datasets: [{ label: "Entrées", data: income, backgroundColor: "rgba(52, 211, 153, .68)", borderRadius: 7 }, { label: "Sorties", data: expense, backgroundColor: "rgba(251, 113, 133, .65)", borderRadius: 7 }] }, options: { maintainAspectRatio: false, responsive: true, plugins: { legend: { labels: { color: "#cbd5e1", boxWidth: 10, font: { size: 11 } } }, tooltip: { callbacks: { label: context => `${context.dataset.label} : ${treasuryMoney(context.raw)}` } } }, scales: { x: { grid: { display: false }, ticks: { color: "#94a3b8" } }, y: { beginAtZero: true, grid: { color: "rgba(148,163,184,.1)" }, ticks: { color: "#94a3b8", callback: value => `${value} €` } } } } });
}
