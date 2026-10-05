// Trésorerie : lecture des relevés CSV.

function parseTreasuryCsvLine(line, separator) {
  const values = []; let value = ""; let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"') { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === separator && !quoted) { values.push(value.trim()); value = ""; }
    else value += character;
  }
  values.push(value.trim());
  return values;
}

function parseTreasuryCsvAmount(value) {
  const raw = String(value || "").replace(/\s/g, "").replace(/€/g, "");
  const normalized = (raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw).replace(/[^0-9.-]/g, "");
  return Number(normalized);
}

function parseTreasuryCsvDate(value) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (!match) return null;
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function parseTreasuryCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return { error: "Le fichier CSV ne contient pas de mouvements" };
  const separator = lines[0].includes(";") ? ";" : ",";
  const normalize = value => String(value).toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const headers = parseTreasuryCsvLine(lines[0], separator).map(normalize);
  const dateIndex = headers.findIndex(header => header.includes("date"));
  const labelIndex = headers.findIndex(header => /libelle|description|intitule|operation/.test(header));
  const amountIndex = headers.findIndex(header => /montant|amount/.test(header));
  const debitIndex = headers.findIndex(header => /debit|sortie/.test(header));
  const creditIndex = headers.findIndex(header => /credit|entree/.test(header));
  if (dateIndex < 0 || labelIndex < 0 || (amountIndex < 0 && debitIndex < 0 && creditIndex < 0)) {
    return { error: "CSV attendu : Date, Libellé, Montant — ou Débit et Crédit" };
  }
  const entries = lines.slice(1).map(line => {
    const values = parseTreasuryCsvLine(line, separator);
    const date = parseTreasuryCsvDate(values[dateIndex]);
    const label = values[labelIndex];
    let signedAmount = amountIndex >= 0 ? parseTreasuryCsvAmount(values[amountIndex]) : 0;
    if (amountIndex < 0) {
      const credit = parseTreasuryCsvAmount(values[creditIndex]);
      const debit = parseTreasuryCsvAmount(values[debitIndex]);
      signedAmount = Number.isFinite(credit) && credit !== 0 ? credit : -Math.abs(debit || 0);
    }
    if (!date || !label || !Number.isFinite(signedAmount) || signedAmount === 0) return null;
    return { date, label, type: signedAmount > 0 ? "income" : "expense", amount: Math.abs(signedAmount) };
  }).filter(Boolean);
  return { entries };
}
