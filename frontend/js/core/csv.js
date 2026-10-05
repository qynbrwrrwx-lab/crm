// core/csv.js: fonctions extraites sans changement de comportement.

function escapeCsvValue(value) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}

function downloadCsvFile(lines, label) {
  const csv = `\uFEFF${lines.map(line => line.map(escapeCsvValue).join(";")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `my-prospect-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Export CSV téléchargé");
}

function parseCsvImport(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ";" && !quoted) { row.push(value.trim()); value = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      if (row.some(cell => cell)) rows.push(row);
      row = []; value = "";
    } else value += character;
  }
  row.push(value.trim());
  if (row.some(cell => cell)) rows.push(row);
  if (rows.length < 2) throw new Error("Le fichier CSV ne contient aucune ligne à importer");

  const normalize = value => String(value || "").trim().toLocaleLowerCase("fr-FR");
  const headers = rows.shift().map(normalize);
  return rows.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

async function readCsvImport(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return null;
  if (file.size > 2 * 1024 * 1024) throw new Error("Le fichier est trop volumineux (maximum 2 Mo)");
  return parseCsvImport(await file.text());
}
