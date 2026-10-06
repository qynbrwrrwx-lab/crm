// Clients : enregistrement, édition et écouteurs du formulaire.

async function geocodeContactAddress(address) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const locations = response.ok ? await response.json() : [];
    if (!locations.length) return { lat: null, lng: null };
    return { lat: parseFloat(locations[0].lat), lng: parseFloat(locations[0].lon) };
  } catch {
    console.warn("Géolocalisation indisponible : contact enregistré sans coordonnées.");
    return { lat: null, lng: null };
  }
}

function getContactSaveRequest(contact, coordinates) {
  const isEditing = Boolean(editingContactId);
  return {
    url: isEditing ? `/api/contacts/${editingContactId}` : "/api/contacts",
    options: {
      method: isEditing ? "PUT" : "POST",
      body: JSON.stringify({ ...contact, ...coordinates })
    }
  };
}

function setContactFormMode(isEditing) {
  document.getElementById("contactFormTitle").textContent = isEditing ? "Modifier le client" : "Ajouter un client";
  document.getElementById("contactSubmitButton").textContent = isEditing ? "Enregistrer les modifications" : "Enregistrer le client";
  document.getElementById("cancelContactEditButton").hidden = !isEditing;
}

function finishContactSave() {
  clearContactForm();
  editingContactId = null;
  setContactFormMode(false);
  updateContactFormExperience();
  loadContacts();
  loadInvoiceData();
  celebrateFormCard(".contact-form-card");
  showToast("Contact enregistré ✅");
}

async function addContact() {
  const contact = readContactFormData();
  if (!contact.billingAddress) return showToast("Adresse obligatoire ❗");
  showLoader();
  const coordinates = await geocodeContactAddress(contact.billingAddress);
  const request = getContactSaveRequest(contact, coordinates);
  try {
    await apiFetch(request.url, request.options);
    finishContactSave();
  } catch (error) {
    showToast(error.message || "Impossible d'enregistrer le contact");
  } finally {
    hideLoader();
  }
}

function editContact(id) {
  const contact = allContacts.find(item => item._id === id);
  if (!contact) return;

  editingContactId = id;
  setContactFormMode(true);
  populateContactForm(contact);
  syncShippingAddress();
  updateContactFormExperience();
  showToast("Modifiez le contact puis enregistrez-le");
}

function resetContactFormMode() {
  setContactFormMode(false);
}

function cancelContactEdit() {
  editingContactId = null;
  clearContactForm();
  setContactFormMode(false);
  updateContactFormExperience();
  showToast("Modification annulée");
}

function bindContactFormExperienceEvents() {
  const fields = ["type", "firstname", "lastname", "contactCompany", "siret", "emailContact", "phone", "billingAddress"];
  fields.forEach(id => {
    const field = document.getElementById(id);
    field?.addEventListener("input", updateContactFormExperience);
    field?.addEventListener("change", updateContactFormExperience);
  });
  document.getElementById("copyBillingAddress")?.addEventListener("change", syncShippingAddress);
  document.getElementById("billingAddress")?.addEventListener("input", () => {
    if (document.getElementById("copyBillingAddress")?.checked) syncShippingAddress();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindContactFormExperienceEvents();
  updateContactFormExperience();
});
