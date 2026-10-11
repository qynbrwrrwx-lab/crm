// Entreprise : logo.

document.getElementById("companyLogo")?.addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = loadEvent => {
    companyLogoBase64 = loadEvent.target.result;
    updateCompanyLogoPreviews(companyLogoBase64);
  };
  reader.readAsDataURL(file);
});
