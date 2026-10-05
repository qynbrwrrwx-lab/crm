// Trésorerie : séries mensuelles du graphique.

function getTreasuryChartData(entries, now = new Date()) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now); date.setDate(1); date.setMonth(date.getMonth() - (5 - index));
    return { key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`, label: date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }) };
  });
  const totals = new Map(months.map(month => [month.key, { income: 0, expense: 0 }]));
  entries.forEach(entry => {
    const date = new Date(entry.date); const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const total = totals.get(key); if (total) total[entry.type] += Number(entry.amount || 0);
  });
  return { labels: months.map(month => month.label), income: months.map(month => totals.get(month.key).income), expense: months.map(month => totals.get(month.key).expense) };
}
