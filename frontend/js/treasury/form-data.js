// Trésorerie : lecture et remise à zéro des champs de formulaire.

function readTreasurySettingsForm() {
  return {
    openingBalance: Number(document.getElementById("treasuryOpeningBalance").value),
    minimumBalance: Number(document.getElementById("treasuryMinimumBalance").value || 0),
    openingBalanceDate: document.getElementById("treasuryOpeningBalanceDate").value
  };
}

function readTreasuryEntryForm() {
  return {
    label: document.getElementById("treasuryEntryLabel").value.trim(),
    amount: Number(document.getElementById("treasuryEntryAmount").value),
    type: document.getElementById("treasuryEntryType").value,
    date: document.getElementById("treasuryEntryDate").value
  };
}

function populateTreasuryEntryForm(entry) {
  document.getElementById("treasuryEntryLabel").value = entry.label || "";
  document.getElementById("treasuryEntryType").value = entry.type || "income";
  document.getElementById("treasuryEntryAmount").value = Number(entry.amount || 0).toFixed(2);
  document.getElementById("treasuryEntryDate").value = entry.date?.slice?.(0, 10) || "";
}

function resetTreasuryEntryForm() {
  document.getElementById("treasuryEntryForm")?.reset();
  const date = document.getElementById("treasuryEntryDate");
  if (date) date.value = new Date().toISOString().slice(0, 10);
}
