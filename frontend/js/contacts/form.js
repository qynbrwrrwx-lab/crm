// Clients : enregistrement, édition et écouteurs du formulaire.

async function addContact() {
  const contact = readContactFormData();
  if (!contact.billingAddress) return showToast("Adresse obligatoire ❗");
  showLoader(); let lat = null, lng = null;
  try { const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(contact.billingAddress)}`); const data = response.ok ? await response.json() : []; if (data.length) { lat = parseFloat(data[0].lat); lng = parseFloat(data[0].lon); } } catch { console.warn("Géolocalisation indisponible : contact enregistré sans coordonnées."); }
  try { await apiFetch(editingContactId ? `/api/contacts/${editingContactId}` : "/api/contacts", { method: editingContactId ? "PUT" : "POST", body: JSON.stringify({ ...contact, lat, lng }) }); clearContactForm(); editingContactId = null; resetContactFormMode(); updateContactFormExperience(); loadContacts(); loadInvoiceData(); celebrateFormCard(".contact-form-card"); showToast("Contact enregistré ✅"); }
  catch (error) { showToast(error.message || "Impossible d'enregistrer le contact"); } finally { hideLoader(); }
}
function editContact(id) { const contact = allContacts.find(item => item._id === id); if (!contact) return; editingContactId = id; document.getElementById("contactFormTitle").textContent = "Modifier le client"; document.getElementById("contactSubmitButton").textContent = "Enregistrer les modifications"; document.getElementById("cancelContactEditButton").hidden = false; populateContactForm(contact); syncShippingAddress(); updateContactFormExperience(); showToast("Modifiez le contact puis enregistrez-le"); }
function resetContactFormMode() { document.getElementById("contactFormTitle").textContent = "Ajouter un client"; document.getElementById("contactSubmitButton").textContent = "Enregistrer le client"; document.getElementById("cancelContactEditButton").hidden = true; }
function cancelContactEdit() { editingContactId = null; clearContactForm(); resetContactFormMode(); updateContactFormExperience(); showToast("Modification annulée"); }
document.addEventListener("DOMContentLoaded", () => { ["type", "firstname", "lastname", "contactCompany", "siret", "emailContact", "phone", "billingAddress"].forEach(id => { document.getElementById(id)?.addEventListener("input", updateContactFormExperience); document.getElementById(id)?.addEventListener("change", updateContactFormExperience); }); document.getElementById("copyBillingAddress")?.addEventListener("change", syncShippingAddress); document.getElementById("billingAddress")?.addEventListener("input", () => { if (document.getElementById("copyBillingAddress")?.checked) syncShippingAddress(); }); updateContactFormExperience(); });
