// Clients : csv. Voir README.md.

const contactCsvHeaders = ["Type", "Entreprise", "Prénom", "Nom", "SIRET", "E-mail", "Téléphone", "Adresse facturation", "Adresse livraison", "Notes"];

function getContactCsvLines(contacts) {
  return [contactCsvHeaders, ...contacts.map(contact => [
    contact.type || "",
    contact.companyName || "",
    contact.firstname || "",
    contact.lastname || "",
    contact.siret || "",
    contact.email || "",
    contact.phone || "",
    contact.billingAddress || "",
    contact.shippingAddress || "",
    contact.notes || ""
  ])];
}

function exportContactsCsv() {
  downloadCsvFile(getContactCsvLines(allContacts), "clients");
}

function isValidContactCsvRow(row) {
  return Boolean(row["adresse facturation"] && (row.nom || row.entreprise));
}

function getContactFromCsvRow(row) {
  return {
    type: row.type || "particulier",
    companyName: row.entreprise || "",
    firstname: row["prénom"] || row.prenom || "",
    lastname: row.nom || "",
    siret: row.siret || "",
    email: row["e-mail"] || row.email || "",
    phone: row["téléphone"] || row.telephone || "",
    billingAddress: row["adresse facturation"],
    shippingAddress: row["adresse livraison"] || "",
    notes: row.notes || ""
  };
}

function getContactImportMessage(total, failures) {
  if (!failures.length) return `${total} clients importés ✅`;
  return `${total - failures.length} clients importés, ${failures.length} ligne(s) ignorée(s)`;
}

async function handleContactsCsvImport(event) {
  try {
    const rows = await readCsvImport(event);
    if (!rows) return;
    const validRows = rows.filter(isValidContactCsvRow);
    if (!validRows.length) throw new Error("Aucune ligne valide : nom ou entreprise et adresse de facturation sont obligatoires");
    if (!await confirmAppAction({ title: "Importer des clients ?", message: `${validRows.length} client(s) valide(s) vont être ajouté(s) à votre répertoire.`, actionLabel: "Importer les clients" })) return;

    showLoader();
    const failures = [];
    for (const [index, row] of validRows.entries()) {
      try {
        await apiFetch("/api/contacts", {
          method: "POST",
          body: JSON.stringify(getContactFromCsvRow(row))
        });
      } catch (err) { failures.push(index + 1); }
    }
    await loadContacts();
    showToast(getContactImportMessage(validRows.length, failures));
  } catch (err) {
    showToast(err.message || "Import clients impossible");
  } finally {
    hideLoader();
  }
}
