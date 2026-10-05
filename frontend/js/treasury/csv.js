// Trésorerie : csv.

function exportTreasuryCsv() {
  if (!treasuryEntries.length) return showToast("Aucun mouvement à exporter");
  const quote = escapeCsvValue;
  const rows = [["Date", "Libellé", "Type", "Montant", "Impact"]];
  treasuryEntries.forEach(entry => rows.push([
    entry.date?.slice?.(0, 10) || "",
    entry.label,
    entry.type === "income" ? "Entrée" : "Sortie",
    Number(entry.amount || 0).toFixed(2).replace(".", ","),
    `${entry.type === "income" ? "+" : "-"}${Number(entry.amount || 0).toFixed(2).replace(".", ",")}`
  ]));
  const blob = new Blob(["\uFEFF", rows.map(row => row.map(quote).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `my-prospect-tresorerie-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  showToast("Export CSV téléchargé");
}

async function importTreasuryCsv(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = parseTreasuryCsv(text);
    if (parsed.error) return showToast(parsed.error);
    const { entries } = parsed;
    if (!entries.length) return showToast("Aucun mouvement exploitable n'a été trouvé");
    const confirmed = await confirmAppAction({ title: "Importer le relevé", message: `${entries.length} mouvement${entries.length > 1 ? "s" : ""} sera/seront importé(s). Les doublons déjà importés seront ignorés.`, actionLabel: "Importer" });
    if (!confirmed) return;
    const result = await apiFetch("/api/treasury/entries/import", { method: "POST", body: JSON.stringify({ entries }) });
    showToast(`${result.imported} mouvement${result.imported > 1 ? "s" : ""} importé${result.imported > 1 ? "s" : ""}${result.ignored ? ` · ${result.ignored} doublon${result.ignored > 1 ? "s" : ""} ignoré${result.ignored > 1 ? "s" : ""}` : ""}`);
    await loadTreasury();
  } catch (error) { showToast(error.message || "Impossible d'importer ce fichier CSV"); }
}
