// Trésorerie : reconciliation.

function renderTreasuryReconciliationSuggestions() {
  const container = document.getElementById("treasuryReconciliationList");
  if (!container) return;
  const invoices = typeof allInvoices === "undefined" ? [] : allInvoices;
  const expenses = typeof allExpenses === "undefined" ? [] : allExpenses;
  const { imported, suggestions } = getTreasuryReconciliationSuggestions(treasuryEntries, invoices, expenses);
  if (!suggestions.length) {
    container.innerHTML = imported.length ? '<p class="empty-state">Aucune correspondance exacte trouvée. Vérifiez vos montants ou saisissez les paiements manuellement.</p>' : '<p class="empty-state">Importez un relevé CSV pour obtenir des suggestions.</p>';
    return;
  }
  container.innerHTML = suggestions.map(suggestion => `<article class="treasury-reconciliation-row"><div><span>${suggestion.entry.type === "income" ? "Encaissement importé" : "Débit importé"}</span><strong>${escapeHtml(suggestion.entry.label)}</strong><small>${treasuryMoney(suggestion.entry.amount)} · ${treasuryDate(suggestion.entry.date)}</small></div><div class="treasury-reconciliation-target"><small>Correspondance possible</small><strong>${escapeHtml(suggestion.target)}</strong><span>${escapeHtml(suggestion.detail)}</span></div><div class="treasury-reconciliation-actions"><button type="button" class="expense-text-action" onclick="openTreasurySuggestion('${suggestion.kind}', '${suggestion.id}')">Vérifier</button><button type="button" class="secondary-btn" onclick="confirmTreasurySuggestion('${suggestion.kind}', '${suggestion.id}', ${Number(suggestion.entry.amount)})">Valider</button></div></article>`).join("");
}

function openTreasurySuggestion(kind, id) {
  if (kind === "invoice") { showSection("invoicesSection"); openInvoice(id); return; }
  showSection("expensesSection");
  const expense = typeof allExpenses === "undefined" ? null : allExpenses.find(item => item._id === id);
  const search = document.getElementById("expensesFilter");
  if (search && expense) { search.value = expense.label; renderExpenses(); }
}

async function confirmTreasurySuggestion(kind, id, amount) {
  const action = kind === "invoice" ? "enregistrera ce montant comme un virement reçu" : "marquera cette dépense comme réglée";
  const confirmed = await confirmAppAction({ title: "Valider le rapprochement", message: `Cette action ${action}. Vérifiez le document avant de confirmer.`, actionLabel: "Valider" });
  if (!confirmed) return;
  try {
    if (kind === "invoice") await apiFetch(`/api/invoices/pay/${id}`, { method: "PUT", body: JSON.stringify({ paymentMethod: "Virement bancaire", amount }) });
    else await apiFetch(`/api/expenses/${id}/pay`, { method: "PUT" });
    showToast(kind === "invoice" ? "Paiement de facture enregistré" : "Dépense marquée comme réglée");
    await Promise.all([loadInvoices(), loadExpenses(), loadTreasury()]);
  } catch (error) { showToast(error.message || "Impossible de valider ce rapprochement"); }
}
