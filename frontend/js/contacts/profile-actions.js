// Clients : actions de la fiche profil.

function getClientProfileActionsPresentation(contact, id) {
  return {
    id,
    emailHref: contact.email ? `mailto:${encodeURIComponent(contact.email)}` : null
  };
}

function renderClientProfileActions(contact, id) {
  const presentation = getClientProfileActionsPresentation(contact, id);
  return `
    <div class="client-profile-actions">
      <button class="primary-btn" onclick="createQuoteForContact('${presentation.id}')">Créer un devis</button>
      <button class="secondary-btn" onclick="createOpportunityForContact('${presentation.id}')">Ajouter une opportunité</button>
      <button class="secondary-btn" onclick="createAppointmentForContact('${presentation.id}')">Planifier un rendez-vous</button>
      <button class="secondary-btn" onclick="editContactFromProfile('${presentation.id}')">Modifier la fiche</button>
      ${presentation.emailHref ? `<a class="secondary-btn" href="${presentation.emailHref}">Envoyer un e-mail</a>` : ""}
    </div>`;
}
