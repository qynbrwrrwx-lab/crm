// Entreprise : electronic.

function updateElectronicInvoicingPreview(company = null) {
  const enabled = document.getElementById("eInvoiceEnabled")?.value === "true";
  const providerName = document.getElementById("eInvoiceProviderName")?.value.trim();
  const identityComplete = [
    document.getElementById("companyName")?.value,
    document.getElementById("companySiret")?.value,
    document.getElementById("companyAddress")?.value,
    document.getElementById("companyPostalCode")?.value,
    document.getElementById("companyCity")?.value
  ].every(value => String(value || "").trim());
  const readiness = document.getElementById("eInvoiceReadiness");
  const identity = document.getElementById("eInvoiceIdentityStatus");
  const provider = document.getElementById("eInvoiceProviderStatus");
  if (identity) identity.textContent = identityComplete ? "Identité entreprise prête" : "Identité entreprise à compléter";
  if (provider) provider.textContent = providerName ? `Plateforme envisagée : ${providerName}` : "Plateforme non sélectionnée";
  if (readiness) {
    readiness.textContent = enabled && identityComplete ? "Préparation en cours" : "À configurer";
    readiness.classList.toggle("is-ready", enabled && identityComplete);
  }
}

async function loadElectronicInvoicingStatus() {
  try {
    const status = await apiFetch("/api/electronic-invoicing/status");
    const documents = document.getElementById("eInvoiceDocumentsStatus");
    if (documents) {
      documents.textContent = status.preparedDocuments
        ? `${status.preparedDocuments} document${status.preparedDocuments > 1 ? "s" : ""} prêt${status.preparedDocuments > 1 ? "s" : ""} à transmettre`
        : "Aucun document préparé";
    }
  } catch (err) {
    console.warn("Statut de facturation électronique indisponible", err);
  }
}

document.getElementById("eInvoiceEnabled")?.addEventListener("input", () => updateElectronicInvoicingPreview());

document.getElementById("eInvoiceEnabled")?.addEventListener("change", () => updateElectronicInvoicingPreview());

document.getElementById("eInvoiceProviderName")?.addEventListener("input", () => updateElectronicInvoicingPreview());

document.getElementById("eInvoiceProviderName")?.addEventListener("change", () => updateElectronicInvoicingPreview());

document.getElementById("eInvoiceFormat")?.addEventListener("input", () => updateElectronicInvoicingPreview());

document.getElementById("eInvoiceFormat")?.addEventListener("change", () => updateElectronicInvoicingPreview());

document.getElementById("companySiret")?.addEventListener("input", () => updateElectronicInvoicingPreview());

document.getElementById("companySiret")?.addEventListener("change", () => updateElectronicInvoicingPreview());

document.getElementById("companyAddress")?.addEventListener("input", () => updateElectronicInvoicingPreview());

document.getElementById("companyAddress")?.addEventListener("change", () => updateElectronicInvoicingPreview());

document.getElementById("companyPostalCode")?.addEventListener("input", () => updateElectronicInvoicingPreview());

document.getElementById("companyPostalCode")?.addEventListener("change", () => updateElectronicInvoicingPreview());

document.getElementById("companyCity")?.addEventListener("input", () => updateElectronicInvoicingPreview());

document.getElementById("companyCity")?.addEventListener("change", () => updateElectronicInvoicingPreview());
