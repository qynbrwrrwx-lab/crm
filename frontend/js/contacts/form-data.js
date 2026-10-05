// Lecture et remplissage des champs du formulaire client.
const contactFormFieldIds = [
  "firstname", "lastname", "contactCompany", "siret", "emailContact", "phone",
  "billingAddress", "shippingAddress", "notes", "contactTags", "contactFollowUpAt"
];

function readContactFormData() {
  return {
    type: document.getElementById("type").value,
    firstname: document.getElementById("firstname").value,
    lastname: document.getElementById("lastname").value,
    companyName: document.getElementById("contactCompany").value,
    siret: document.getElementById("siret").value,
    email: document.getElementById("emailContact").value,
    phone: document.getElementById("phone").value,
    billingAddress: document.getElementById("billingAddress").value,
    shippingAddress: document.getElementById("shippingAddress").value,
    notes: document.getElementById("notes").value,
    tags: normalizeContactTags(document.getElementById("contactTags").value),
    nextFollowUpAt: document.getElementById("contactFollowUpAt").value || null
  };
}

function clearContactForm() {
  contactFormFieldIds.forEach(id => { document.getElementById(id).value = ""; });
  document.getElementById("type").value = "particulier";
  document.getElementById("copyBillingAddress").checked = false;
  document.getElementById("shippingAddress").readOnly = false;
}

function populateContactForm(contact) {
  document.getElementById("type").value = contact.type || "particulier";
  document.getElementById("contactCompany").value = contact.companyName || "";
  document.getElementById("firstname").value = contact.firstname || "";
  document.getElementById("lastname").value = contact.lastname || "";
  document.getElementById("siret").value = contact.siret || "";
  document.getElementById("emailContact").value = contact.email || "";
  document.getElementById("phone").value = contact.phone || "";
  document.getElementById("billingAddress").value = contact.billingAddress || "";
  document.getElementById("shippingAddress").value = contact.shippingAddress || "";
  document.getElementById("notes").value = contact.notes || "";
  document.getElementById("contactTags").value = (contact.tags || []).join(", ");
  document.getElementById("contactFollowUpAt").value = contact.nextFollowUpAt
    ? new Date(contact.nextFollowUpAt).toISOString().slice(0, 10)
    : "";
  document.getElementById("copyBillingAddress").checked =
    Boolean(contact.shippingAddress) && contact.shippingAddress === contact.billingAddress;
}
