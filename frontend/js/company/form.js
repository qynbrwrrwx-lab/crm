// Entreprise : form.

function setCompanyEditMode(editing) {
  document.querySelectorAll(".company-field").forEach(field => {
    if (editing) field.removeAttribute("readonly");
    else field.setAttribute("readonly", true);
    if (field.tagName === "SELECT") field.disabled = !editing;
  });
  document.querySelectorAll(".company-editable-control").forEach(field => {
    field.disabled = !editing;
  });
  document.getElementById("companyLogoSection").style.display = editing ? "block" : "none";
  document.getElementById("editCompanyBtn").style.display = editing ? "none" : "inline-flex";
  document.getElementById("saveCompanyBtn").style.display = editing ? "inline-flex" : "none";
}

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

    setCompanyEditMode(false);

  } catch (err) {

    console.error(err);

    showToast(err.message || "Impossible d’enregistrer le profil");
  }
}

function enableCompanyEdit() {
  setCompanyEditMode(true);
}
