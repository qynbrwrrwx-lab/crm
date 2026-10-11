// Entreprise : données enregistrées depuis le formulaire.

function getElectronicInvoicingFormData({ enabled, providerName, preferredFormat }) {
  return {
    enabled: enabled === "true",
    providerName: String(providerName || "").trim(),
    preferredFormat
  };
}

function getCompanyFormData() {
  const value = id => document.getElementById(id).value;
  return {
    companyName: value("companyName"),
    siret: value("companySiret"), vatNumber: value("companyVat"), phone: value("companyPhone"),
    email: value("companyEmail"), replyToEmail: value("companyReplyToEmail"),
    documentEmailIntro: value("documentEmailIntro"), documentEmailClosing: value("documentEmailClosing"),
    website: value("companyWebsite"), address: value("companyAddress"),
    postalCode: value("companyPostalCode"), city: value("companyCity"), activityType: value("activityType"),
    quantityUnit: value("quantityUnit"), customUnit: value("customUnit"), rcs: value("companyRcs"),
    ape: value("companyApe"), companyIban: value("companyIban"), companyBic: value("companyBic"),
    companyBank: value("companyBank"), companyAccountHolder: value("companyAccountHolder"), currency: value("currency"),
    quoteValidity: Number(value("quoteValidity")), deliveryTerms: value("companyPaymentTerms"),
    paymentDueDays: Number(value("companyPaymentDueDays")),
    electronicInvoicing: getElectronicInvoicingFormData({
      enabled: value("eInvoiceEnabled"),
      providerName: value("eInvoiceProviderName"),
      preferredFormat: value("eInvoiceFormat")
    }),
    logo: companyLogoBase64
  };
}
