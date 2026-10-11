// Trésorerie : list.

function getTreasuryEntryPresentation(entry) {
  return {
    id: entry._id,
    className: `treasury-entry-row ${entry.type}`,
    label: entry.label,
    dateLabel: treasuryDate(entry.date),
    amountLabel: `${entry.type === "income" ? "+" : "−"}${treasuryMoney(entry.amount)}`,
    isImported: Boolean(entry.importFingerprint)
  };
}

function getTreasuryListPresentation(entries, settings = {}, { query = "", typeFilter = "all" } = {}) {
  const income = entries.filter(entry => entry.type === "income").reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const expense = entries.filter(entry => entry.type === "expense").reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const balance = Number(settings.openingBalance || 0) + income - expense;
  const normalizedQuery = query.trim().toLocaleLowerCase("fr-FR");
  const visibleEntries = entries.filter(entry => {
    const matchesText = entry.label.toLocaleLowerCase("fr-FR").includes(normalizedQuery);
    const matchesType = typeFilter === "all" || entry.type === typeFilter || (typeFilter === "imported" && Boolean(entry.importFingerprint));
    return matchesText && matchesType;
  }).map(getTreasuryEntryPresentation);
  return {
    balance,
    balanceLabel: treasuryMoney(balance),
    incomeLabel: treasuryMoney(income),
    expenseLabel: treasuryMoney(expense),
    balanceDetail: `Référence au ${treasuryDate(settings.openingBalanceDate)} · ${entries.length} mouvement${entries.length > 1 ? "s" : ""}`,
    openingBalanceValue: Number(settings.openingBalance || 0).toFixed(2),
    minimumBalanceValue: Number(settings.minimumBalance || 0).toFixed(2),
    openingBalanceDateValue: settings.openingBalanceDate?.slice?.(0, 10) || new Date().toISOString().slice(0, 10),
    visibleEntries,
    emptyMessage: entries.length ? "Aucun mouvement ne correspond aux filtres." : "Aucun mouvement manuel pour le moment."
  };
}

function renderTreasury() {
  const presentation = getTreasuryListPresentation(treasuryEntries, treasurySettings, {
    query: document.getElementById("treasuryEntriesFilter")?.value || "",
    typeFilter: document.getElementById("treasuryEntriesTypeFilter")?.value || "all"
  });
  document.getElementById("treasuryCurrentBalance").textContent = presentation.balanceLabel;
  document.getElementById("treasuryIncomeTotal").textContent = presentation.incomeLabel;
  document.getElementById("treasuryExpenseTotal").textContent = presentation.expenseLabel;
  document.getElementById("treasuryBalanceDetail").textContent = presentation.balanceDetail;
  document.getElementById("treasuryOpeningBalance").value = presentation.openingBalanceValue;
  document.getElementById("treasuryMinimumBalance").value = presentation.minimumBalanceValue;
  document.getElementById("treasuryOpeningBalanceDate").value = presentation.openingBalanceDateValue;
  const list = document.getElementById("treasuryEntriesList");
  if (!list) return;
  list.innerHTML = presentation.visibleEntries.length ? presentation.visibleEntries.map(item => {
    const badge = item.isImported ? '<span class="treasury-imported-badge">Importé</span>' : "";
    return `<article class="${item.className}"><div><strong>${escapeHtml(item.label)}${badge}</strong><small>${item.dateLabel}</small></div><b>${item.amountLabel}</b><div class="expense-actions"><button type="button" class="expense-text-action" onclick="editTreasuryEntry('${item.id}')">Modifier</button><button type="button" class="expense-text-action danger" onclick="deleteTreasuryEntry('${item.id}')">Supprimer</button></div></article>`;
  }).join("") : `<p class="empty-state">${presentation.emptyMessage}</p>`;
  renderTreasuryForecast(presentation.balance);
  renderTreasuryChart();
  renderTreasuryReconciliationSuggestions();
}

async function loadTreasury() {
  try { const data = await apiFetch("/api/treasury"); treasurySettings = data.settings; treasuryEntries = data.entries; renderTreasury(); } catch (error) { console.error("Impossible de charger la trésorerie", error); }
}
