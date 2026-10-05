// Trésorerie : forecast.

function renderTreasuryForecast(currentBalance) {
  const invoices = typeof allInvoices === "undefined" ? [] : allInvoices;
  const expenses = typeof allExpenses === "undefined" ? [] : allExpenses;
  const { items, income, expense, projected } = getTreasuryForecastData(currentBalance, invoices, expenses);
  const set = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = treasuryMoney(value); };
  set("treasuryForecastIncome", income); set("treasuryForecastExpense", expense); set("treasuryForecastBalance", projected);
  const balanceNode = document.getElementById("treasuryForecastBalance");
  if (balanceNode) balanceNode.className = projected >= 0 ? "positive" : "negative";
  updateTreasuryForecastAlert(projected, income, expense);
  const list = document.getElementById("treasuryForecastList");
  if (!list) return;
  list.innerHTML = items.length ? items.slice(0, 8).map(item => `<div class="treasury-forecast-row ${item.type}"><span>${treasuryDate(item.date)}</span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.detail || (item.type === "income" ? "Encaissement attendu" : "Décaissement prévu"))}</small><b>${item.type === "income" ? "+" : "−"}${treasuryMoney(item.amount)}</b></div>`).join("") : '<p class="empty-state">Aucune échéance prévue dans les 30 jours.</p>';
}

function updateTreasuryForecastAlert(projected, income, expense) {
  const label = document.getElementById("dashboardTreasuryAlertLabel");
  const detail = document.getElementById("dashboardTreasuryAlertDetail");
  const button = document.getElementById("dashboardTreasuryAlertButton");
  const dot = document.getElementById("dashboardTreasuryAlertDot");
  if (!label || !detail || !button) return;
  const hasReference = Boolean(treasurySettings?._id);
  const hasForecast = income > 0 || expense > 0;
  if (!hasReference) {
    label.textContent = "Trésorerie prévisionnelle à calculer";
    detail.textContent = "Renseignez un solde de référence pour activer cette alerte.";
    dot?.classList.remove("overdue");
  } else if (!hasForecast) {
    label.textContent = "Aucune échéance de trésorerie à 30 jours";
    detail.textContent = "Les prochaines factures et dépenses apparaîtront ici.";
    dot?.classList.remove("overdue");
  } else if (projected < Number(treasurySettings.minimumBalance || 0)) {
    const reserve = Number(treasurySettings.minimumBalance || 0);
    label.textContent = projected < 0 ? "Solde prévisionnel négatif" : "Réserve de trésorerie insuffisante";
    detail.textContent = `${treasuryMoney(Math.max(0, reserve - projected))} manque${reserve ? " pour atteindre votre réserve minimale" : " à couvrir"}.`;
    dot?.classList.add("overdue");
  } else {
    label.textContent = "Trésorerie prévisionnelle positive";
    detail.textContent = `Solde estimé : ${treasuryMoney(projected)} dans 30 jours.`;
    dot?.classList.remove("overdue");
  }
  button.textContent = "Voir";
  button.onclick = () => showSection("treasurySection");
}
