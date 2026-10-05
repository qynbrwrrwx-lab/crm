// Trésorerie : list.

function renderTreasury() {
  const income = treasuryEntries.filter(entry => entry.type === "income").reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const expense = treasuryEntries.filter(entry => entry.type === "expense").reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const balance = Number(treasurySettings.openingBalance || 0) + income - expense;
  document.getElementById("treasuryCurrentBalance").textContent = treasuryMoney(balance);
  document.getElementById("treasuryIncomeTotal").textContent = treasuryMoney(income);
  document.getElementById("treasuryExpenseTotal").textContent = treasuryMoney(expense);
  document.getElementById("treasuryBalanceDetail").textContent = `Référence au ${treasuryDate(treasurySettings.openingBalanceDate)} · ${treasuryEntries.length} mouvement${treasuryEntries.length > 1 ? "s" : ""}`;
  document.getElementById("treasuryOpeningBalance").value = Number(treasurySettings.openingBalance || 0).toFixed(2);
  document.getElementById("treasuryMinimumBalance").value = Number(treasurySettings.minimumBalance || 0).toFixed(2);
  document.getElementById("treasuryOpeningBalanceDate").value = treasurySettings.openingBalanceDate?.slice?.(0, 10) || new Date().toISOString().slice(0, 10);
  const list = document.getElementById("treasuryEntriesList");
  if (!list) return;
  const query = document.getElementById("treasuryEntriesFilter")?.value.trim().toLocaleLowerCase("fr-FR") || "";
  const typeFilter = document.getElementById("treasuryEntriesTypeFilter")?.value || "all";
  const visibleEntries = treasuryEntries.filter(entry => {
    const matchesText = entry.label.toLocaleLowerCase("fr-FR").includes(query);
    const matchesType = typeFilter === "all" || entry.type === typeFilter || (typeFilter === "imported" && Boolean(entry.importFingerprint));
    return matchesText && matchesType;
  });
  list.innerHTML = visibleEntries.length ? visibleEntries.map(entry => `<article class="treasury-entry-row ${entry.type}"><div><strong>${escapeHtml(entry.label)}${entry.importFingerprint ? '<span class="treasury-imported-badge">Importé</span>' : ""}</strong><small>${treasuryDate(entry.date)}</small></div><b>${entry.type === "income" ? "+" : "−"}${treasuryMoney(entry.amount)}</b><div class="expense-actions"><button type="button" class="expense-text-action" onclick="editTreasuryEntry('${entry._id}')">Modifier</button><button type="button" class="expense-text-action danger" onclick="deleteTreasuryEntry('${entry._id}')">Supprimer</button></div></article>`).join("") : `<p class="empty-state">${treasuryEntries.length ? "Aucun mouvement ne correspond aux filtres." : "Aucun mouvement manuel pour le moment."}</p>`;
  renderTreasuryForecast(balance);
  renderTreasuryChart();
  renderTreasuryReconciliationSuggestions();
}

async function loadTreasury() {
  try { const data = await apiFetch("/api/treasury"); treasurySettings = data.settings; treasuryEntries = data.entries; renderTreasury(); } catch (error) { console.error("Impossible de charger la trésorerie", error); }
}
