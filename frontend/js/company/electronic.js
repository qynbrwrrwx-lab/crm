// Entreprise : electronic.

function getElectronicInvoicingPreviewPresentation({ enabled, providerName, identityFields }) {
  const identityComplete = identityFields.every(value => String(value || "").trim());
  return {
    identityLabel: identityComplete ? "Identité entreprise prête" : "Identité entreprise à compléter",
    providerLabel: providerName ? `Plateforme envisagée : ${providerName}` : "Plateforme non sélectionnée",
    readinessLabel: enabled && identityComplete ? "Préparation en cours" : "À configurer",
    isReady: enabled && identityComplete
  };
}

function updateElectronicInvoicingPreview() {
  const presentation = getElectronicInvoicingPreviewPresentation({
    enabled: document.getElementById("eInvoiceEnabled")?.value === "true",
    providerName: document.getElementById("eInvoiceProviderName")?.value.trim(),
    identityFields: [
      document.getElementById("companyName")?.value,
      document.getElementById("companySiret")?.value,
      document.getElementById("companyAddress")?.value,
      document.getElementById("companyPostalCode")?.value,
      document.getElementById("companyCity")?.value
    ]
  });
  const readiness = document.getElementById("eInvoiceReadiness");
  const identity = document.getElementById("eInvoiceIdentityStatus");
  const provider = document.getElementById("eInvoiceProviderStatus");
  if (identity) identity.textContent = presentation.identityLabel;
  if (provider) provider.textContent = presentation.providerLabel;
  if (readiness) {
    readiness.textContent = presentation.readinessLabel;
    readiness.classList.toggle("is-ready", presentation.isReady);
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
