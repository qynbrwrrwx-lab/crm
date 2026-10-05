// Chargement et affichage du profil entreprise.
async function loadCompanySetupStatus() {
  const notice = document.getElementById("companySetupNotice");
  if (!notice) return;

  try {
    const company = await apiFetch("/api/company");
    const requiredFields = [company.companyName, company.siret, company.email, company.address, company.city];
    notice.hidden = requiredFields.every(value => String(value || "").trim());
  } catch (err) {
    notice.hidden = false;
  }
}

async function loadCompany() {
  try {
    const company = await apiFetch("/api/company");

    fillCompanyEmailFields(company);
    updateEmailSendingPreview();
    fillCompanyElectronicFields(company);
    loadElectronicInvoicingStatus();
    fillCompanyProfileFields(company);
    updateElectronicInvoicingPreview();

    companyLogoBase64 = company.logo || "";
    updateCompanyLogoPreviews(company.logo);
    displayCompanyProfile();
  } catch (err) {
    console.error(err);
  }
}
