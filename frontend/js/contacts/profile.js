// Clients : profile. Voir README.md.

async function openClientProfile(id) {
  const contact = allContacts.find(item => item._id === id);
  if (!contact) return;

  const modal = document.getElementById("invoiceDetailsModal");
  const title = document.getElementById("detailNumber");
  const type = document.getElementById("detailDocumentType");
  const body = document.getElementById("invoiceDetailsBody");
  const { firstPaidInvoice, latest, nextAction, paidInvoices, pending, related, relatedAgenda, relatedOpportunities, total } = await getClientProfileData(contact);
  const name = contact.companyName || `${contact.firstname || ""} ${contact.lastname || ""}`.trim() || "Client";

  type.textContent = "Fiche client";
  title.textContent = name;
  body.innerHTML = `
    ${renderClientProfileActions(contact, id)}
    ${renderClientProfileOverview(contact, { firstPaidInvoice, latest, paidInvoices, pending, related, total })}
    ${(contact.tags || []).length ? `<div class="client-profile-tags"><span>Étiquettes</span>${contact.tags.map(tag => `<b>${escapeHtml(tag)}</b>`).join("")}</div>` : ""}
    <section class="client-profile-next-action">
      <div class="client-profile-next-icon">↗</div>
      <div><span>Prochaine action conseillée</span><strong>${nextAction.title}</strong><small>${nextAction.detail}</small></div>
      <button type="button" class="secondary-btn" onclick="handleClientNextAction('${id}', '${nextAction.target}')">${nextAction.action}</button>
    </section>
    ${contact.notes ? `
      <section class="client-profile-notes">
        <div><span>Note interne</span><small>Visible uniquement dans votre espace My Prospect</small></div>
        <p>${escapeHtml(contact.notes).replace(/\n/g, "<br>")}</p>
      </section>
    ` : ""}
    ${renderClientProfileHistory({ relatedAgenda, relatedOpportunities, related })}`;
  modal.style.display = "flex";
}
