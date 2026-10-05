// Clients : actions de la fiche profil.

function renderClientProfileActions(contact, id) {
  return `
    <div class="client-profile-actions">
      <button class="primary-btn" onclick="createQuoteForContact('${id}')">Créer un devis</button>
      <button class="secondary-btn" onclick="createOpportunityForContact('${id}')">Ajouter une opportunité</button>
      <button class="secondary-btn" onclick="createAppointmentForContact('${id}')">Planifier un rendez-vous</button>
      <button class="secondary-btn" onclick="editContactFromProfile('${id}')">Modifier la fiche</button>
      ${contact.email ? `<a class="secondary-btn" href="mailto:${encodeURIComponent(contact.email)}">Envoyer un e-mail</a>` : ""}
    </div>`;
}
