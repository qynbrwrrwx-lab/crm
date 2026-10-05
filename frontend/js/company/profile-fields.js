// Remplissage des champs du profil entreprise.
function setCompanyProfileField(id, value) {
  document.getElementById(id).value = value;
}

function fillCompanyEmailFields(company) {
  setCompanyProfileField("companyEmail", company.email || "");
  setCompanyProfileField("companyReplyToEmail", company.replyToEmail || "");
  setCompanyProfileField("documentEmailIntro", company.documentEmailIntro || "");
  setCompanyProfileField("documentEmailClosing", company.documentEmailClosing || "");
}

function fillCompanyElectronicFields(company) {
  const electronicInvoicing = company.electronicInvoicing || {};
  setCompanyProfileField("eInvoiceEnabled", String(Boolean(electronicInvoicing.enabled)));
  setCompanyProfileField("eInvoiceProviderName", electronicInvoicing.providerName || "");
  setCompanyProfileField("eInvoiceFormat", electronicInvoicing.preferredFormat || "factur-x");
}

function fillCompanyProfileFields(company) {
  const fields = {
    companyName: company.companyName || "",
    companySiret: company.siret || "",
    companyVat: company.vatNumber || "",
    companyPhone: company.phone || "",
    companyWebsite: company.website || "",
    companyAddress: company.address || "",
    companyPostalCode: company.postalCode || "",
    companyCity: company.city || "",
    activityType: company.activityType || "Autre",
    quantityUnit: company.quantityUnit || "Pièce",
    customUnit: company.customUnit || "",
    companyRcs: company.rcs || "",
    companyApe: company.ape || "",
    companyIban: company.companyIban || "",
    companyBic: company.companyBic || "",
    companyBank: company.companyBank || "",
    companyAccountHolder: company.companyAccountHolder || "",
    currency: company.currency || "€",
    quoteValidity: company.quoteValidity || 30,
    companyPaymentTerms: company.deliveryTerms || "Paiement à 30 jours",
    companyPaymentDueDays: Number.isFinite(Number(company.paymentDueDays)) ? company.paymentDueDays : 30
  };

  Object.entries(fields).forEach(([id, value]) => setCompanyProfileField(id, value));
}

function updateCompanyLogoPreviews(logo) {
  const logoPreview = document.getElementById("logoPreview");
  const headerLogo = document.getElementById("headerLogo");

  if (logoPreview) logoPreview.src = logo || "";
  if (headerLogo) headerLogo.src = logo || "";
}

function displayCompanyProfile() {
  document.getElementById("companyForm").style.display = "grid";
  document.getElementById("companyLogoSection").style.display = "none";
  document.getElementById("editCompanyBtn").style.display = "inline-flex";
  document.getElementById("saveCompanyBtn").style.display = "none";
  document.querySelectorAll(".company-field").forEach(field => field.setAttribute("readonly", true));
}
