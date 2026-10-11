// Clients : profile. Voir README.md.

function getClientProfilePresentation(contact, id, nextAction) {
  return {
    title: contact.companyName || `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || "Client",
    id,
    tags: contact.tags || [],
    notes: contact.notes || "",
    nextAction
  };
}

async function openClientProfile(id) {
  const contact = allContacts.find(item => item._id === id);
  if (!contact) return;

  const modal = document.getElementById("invoiceDetailsModal");
  const title = document.getElementById("detailNumber");
  const type = document.getElementById("detailDocumentType");
  const body = document.getElementById("invoiceDetailsBody");
  const { firstPaidInvoice, latest, nextAction, paidInvoices, pending, related, relatedAgenda, relatedOpportunities, total } = await getClientProfileData(contact);
  const presentation = getClientProfilePresentation(contact, id, nextAction);

  type.textContent = "Fiche client";
  title.textContent = presentation.title;
  body.innerHTML = `
    ${renderClientProfileActions(contact, id)}
    ${renderClientProfileOverview(contact, { firstPaidInvoice, latest, paidInvoices, pending, related, total })}
    ${presentation.tags.length ? `<div class="client-profile-tags"><span>Étiquettes</span>${presentation.tags.map(tag => `<b>${escapeHtml(tag)}</b>`).join("")}</div>` : ""}
    <section class="client-profile-next-action">
      <div class="client-profile-next-icon">↗</div>
      <div><span>Prochaine action conseillée</span><strong>${presentation.nextAction.title}</strong><small>${presentation.nextAction.detail}</small></div>
      <button type="button" class="secondary-btn" onclick="handleClientNextAction('${presentation.id}', '${presentation.nextAction.target}')">${presentation.nextAction.action}</button>
    </section>
    ${presentation.notes ? `
      <section class="client-profile-notes">
        <div><span>Note interne</span><small>Visible uniquement dans votre espace My Prospect</small></div>
        <p>${escapeHtml(presentation.notes).replace(/\n/g, "<br>")}</p>
      </section>
    ` : ""}
    ${renderClientProfileHistory({ relatedAgenda, relatedOpportunities, related })}`;
  modal.style.display = "flex";
}
