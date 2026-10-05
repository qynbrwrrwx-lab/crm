// Entreprise : form.

async function saveCompany() {

  try {

    await apiFetch("/api/company", {
        method: "PUT",

        body: JSON.stringify(getCompanyFormData())
    });

    updateEmailSendingPreview();
    updateElectronicInvoicingPreview();
    loadElectronicInvoicingStatus();
    loadCompanySetupStatus().catch(console.error);
    loadOnboardingChecklist?.().catch(console.error);
    showToast("Profil de l’entreprise enregistré");

    document
  .querySelectorAll(".company-field")
  .forEach(field => {

    field.setAttribute(
      "readonly",
      true
    );

    if (
      field.tagName === "SELECT"
    ) {
      field.disabled = true;
    }

  });

    document.querySelectorAll(".company-editable-control").forEach(field => {
      field.disabled = true;
    });

    document.getElementById(
  "companyLogoSection"
  ).style.display = "none";

    document.getElementById(
  "editCompanyBtn"
  ).style.display = "inline-flex";

    document.getElementById(
  "saveCompanyBtn"
  ).style.display = "none";

  } catch (err) {

    console.error(err);

    showToast(err.message || "Impossible d’enregistrer le profil");
  }
}

function enableCompanyEdit() {

  document
    .querySelectorAll(".company-field")
    .forEach(field => {

      field.removeAttribute("readonly");

      if (
        field.tagName === "SELECT"
      ) {
        field.disabled = false;
      }

    });

  document.querySelectorAll(".company-editable-control").forEach(field => {
    field.disabled = false;
  });

  document.getElementById(
    "companyLogoSection"
  ).style.display = "block";

  document.getElementById(
    "editCompanyBtn"
  ).style.display = "none";

  document.getElementById(
  "saveCompanyBtn"
  ).style.display = "inline-flex";
}
