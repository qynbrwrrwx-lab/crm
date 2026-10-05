// Entreprise : logo.

document.getElementById("companyLogo")?.addEventListener("change", function (e) {

      const file =
        e.target.files[0];

      if (!file) return;

      const reader =
        new FileReader();

      reader.onload =
  function (event) {

    companyLogoBase64 =
      event.target.result;

    const headerLogo =
      document.getElementById(
        "headerLogo"
      );

    if (headerLogo) {
      headerLogo.src =
        companyLogoBase64;
    }
  };

      reader.readAsDataURL(file);
    });
