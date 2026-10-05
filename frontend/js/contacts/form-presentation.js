// Clients : expérience et aperçu du formulaire.

function updateContactFormExperience() {
  const type = document.getElementById("type")?.value || "particulier", professional = type !== "particulier";
  document.querySelectorAll(".professional-only").forEach(element => element.classList.toggle("is-hidden", !professional));
  document.querySelectorAll("[data-contact-type]").forEach(button => button.classList.toggle("active", button.dataset.contactType === type));
  const fields = ["firstname", "lastname", "emailContact", "phone", "billingAddress"];
  if (professional) fields.push("contactCompany", "siret");
  const percentage = Math.round((fields.filter(id => document.getElementById(id)?.value.trim()).length / fields.length) * 100);
  const bar = document.getElementById("contactCompletenessBar"), text = document.getElementById("contactCompletenessText");
  if (bar) bar.style.width = `${percentage}%`; if (text) text.textContent = percentage === 100 ? "Dossier complet" : `${percentage}% renseigné`;
  const firstname = document.getElementById("firstname")?.value.trim() || "", lastname = document.getElementById("lastname")?.value.trim() || "", company = document.getElementById("contactCompany")?.value.trim() || "", email = document.getElementById("emailContact")?.value.trim() || "", phone = document.getElementById("phone")?.value.trim() || "";
  const name = professional && company ? company : `${firstname} ${lastname}`.trim() || "Client à renseigner", initials = name === "Client à renseigner" ? "CL" : name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const labels = { particulier: "Particulier", pro: "Professionnel", association: "Association" };
  document.getElementById("contactPreviewInitials").textContent = initials; document.getElementById("contactPreviewType").textContent = labels[type]; document.getElementById("contactPreviewName").textContent = name; document.getElementById("contactPreviewDetails").textContent = email || phone || "Ses coordonnées apparaîtront ici."; document.getElementById("contactPreviewStatus").textContent = percentage === 100 ? "Prêt à enregistrer" : "Brouillon";
}
function setContactType(type) { const select = document.getElementById("type"); if (!select || !["particulier", "pro", "association"].includes(type)) return; select.value = type; updateContactFormExperience(); }
function celebrateFormCard(selector) { const card = document.querySelector(selector); if (!card) return; card.classList.remove("form-success-pulse"); void card.offsetWidth; card.classList.add("form-success-pulse"); window.setTimeout(() => card.classList.remove("form-success-pulse"), 850); }
function syncShippingAddress() { const checkbox = document.getElementById("copyBillingAddress"), billing = document.getElementById("billingAddress"), shipping = document.getElementById("shippingAddress"); if (!checkbox || !billing || !shipping) return; if (checkbox.checked) { shipping.value = billing.value; shipping.readOnly = true; } else shipping.readOnly = false; }
