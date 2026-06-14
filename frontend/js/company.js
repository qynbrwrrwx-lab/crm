// ================= COMPANY =================

let companyLogoBase64 = "";

  async function loadCompany() {

  try {

    const res =
      await fetch(
        "/api/company"
      );

    const company =
      await res.json();

      console.log("COMPANY =", company);
      console.log("LOGO =", company.logo);
     
    document.getElementById(
      "companyName"
    ).value =
      company.companyName || "";

    document.getElementById(
      "companySiret"
    ).value =
      company.siret || "";

    document.getElementById(
      "companyVat"
    ).value =
      company.vatNumber || "";

    document.getElementById(
      "companyPhone"
    ).value =
      company.phone || "";

    document.getElementById(
      "companyEmail"
    ).value =
      company.email || "";

    document.getElementById(
      "companyWebsite"
    ).value =
      company.website || "";

    document.getElementById(
      "companyAddress"
    ).value =
      company.address || "";

    document.getElementById(
     "companyPostalCode"
    ).value =
      company.postalCode || "";

    document.getElementById(
      "companyCity"
    ).value =
      company.city || "";

    document.getElementById(
      "activityType"
    ).value =
      company.activityType || "Autre";

    document.getElementById(
      "quantityUnit"
    ).value =
      company.quantityUnit || "Pièce";

    document.getElementById(
      "customUnit"
    ).value =
      company.customUnit || "";

    document.getElementById(
      "companyRcs"
    ).value =
      company.rcs || "";

    document.getElementById(
      "companyApe"
    ).value =
      company.ape || "";

    document.getElementById(
      "companyIban"
    ).value =
     company.companyIban || "";

    document.getElementById(
      "companyBic"
    ).value =
     company.companyBic || "";

    document.getElementById(
      "companyBank"
    ).value =
     company.companyBank || "";

    document.getElementById(
      "companyAccountHolder"
    ).value =
     company.companyAccountHolder || "";

    document.getElementById(
      "currency"
    ).value =
      company.currency || "€";

    companyLogoBase64 =
      company.logo || "";
   
   const logoPreview =
    document.getElementById(
    "logoPreview"
   );

   if (logoPreview) {
      logoPreview.src =
    company.logo || "";
    }

  const headerLogo =
    document.getElementById(
    "headerLogo"
   );

   if (headerLogo) {
      headerLogo.src =
    company.logo || "";
    }

    document.getElementById(
      "companyForm"
    ).style.display = "grid";

    document.getElementById(
     "companyLogoSection"
    ).style.display = "none";

    document.getElementById(
     "editCompanyBtn"
    ).style.display = "inline-flex";

    document.getElementById(
     "saveCompanyBtn"
    ).style.display = "none";

    document
      .querySelectorAll(".company-field")
      .forEach(field => {
        field.setAttribute(
         "readonly",
       true
     );
   });

  } catch (err) {
 
    console.error(err);

  }
}

async function saveCompany() {

  try {

    await fetch(
      "/api/company",
      {
        method: "PUT",

        headers: {
          "Content-Type":
          "application/json"
        },

        body: JSON.stringify({

          companyName:
            document.getElementById(
              "companyName"
            ).value,

          siret:
            document.getElementById(
              "companySiret"
            ).value,

          vatNumber:
            document.getElementById(
              "companyVat"
            ).value,

          phone:
            document.getElementById(
              "companyPhone"
            ).value,

          email:
            document.getElementById(
              "companyEmail"
            ).value,

          website:
            document.getElementById(
              "companyWebsite"
            ).value,

          address:
            document.getElementById(
              "companyAddress"
            ).value,

          postalCode:
           document.getElementById(
             "companyPostalCode"
           ).value,

          city:
            document.getElementById(
              "companyCity"
           ).value,

          activityType:
            document.getElementById(
              "activityType"
            ).value,

          quantityUnit:
            document.getElementById(
              "quantityUnit"
            ).value,

          customUnit:
            document.getElementById(
              "customUnit"
            ).value,

          rcs:
            document.getElementById(
              "companyRcs"
            ).value,

          ape:
            document.getElementById(
              "companyApe"
            ).value,

          companyIban:
            document.getElementById(
              "companyIban"
            ).value,

          companyBic:
            document.getElementById(
              "companyBic"
            ).value,

          companyBank:
            document.getElementById(
              "companyBank"
            ).value,

          companyAccountHolder:
            document.getElementById(
              "companyAccountHolder"
            ).value,

          currency:
            document.getElementById(
              "currency"
            ).value,

          logo:
            companyLogoBase64

       })

      }
    );

    alert(
      "Modifications effectuées ✅"
    );

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

    alert(
      "Erreur sauvegarde"
    );
  }
}

const logoInput =
  document.getElementById(
    "companyLogo"
  );

if (logoInput) {

  logoInput.addEventListener(
    "change",
    function (e) {

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
    }
  );
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