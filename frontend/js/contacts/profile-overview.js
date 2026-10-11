// Clients : synthèse commerciale de la fiche profil.

function getClientProfileOverviewPresentation(contact, { firstPaidInvoice, latest, paidInvoices, pending, related, total }) {
  return {
    email: contact.email || "E-mail non renseigné",
    phone: contact.phone || "Téléphone non renseigné",
    billingAddress: contact.billingAddress || "Adresse de facturation non renseignée",
    totalLabel: formatCurrency(total),
    relatedLabel: `${related.length} document${related.length > 1 ? "s" : ""} associé${related.length > 1 ? "s" : ""}`,
    pendingLabel: formatCurrency(pending),
    latestLabel: latest ? `Dernier document : ${latest.invoiceNumber}` : "Aucune activité commerciale",
    averageLabel: formatCurrency(paidInvoices.length ? total / paidInvoices.length : 0),
    customerSinceLabel: firstPaidInvoice ? `Client depuis le ${new Date(firstPaidInvoice.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}` : "Aucune facture réglée"
  };
}

function renderClientProfileOverview(contact, { firstPaidInvoice, latest, paidInvoices, pending, related, total }) {
  const presentation = getClientProfileOverviewPresentation(contact, { firstPaidInvoice, latest, paidInvoices, pending, related, total });
  return `    <section class="client-profile-overview">
      <div class="client-profile-contact-card">
        <span>Coordonnées</span>
        <strong>${escapeHtml(presentation.email)}</strong>
        <small>${escapeHtml(presentation.phone)}</small>
        <small class="client-profile-address">${escapeHtml(presentation.billingAddress)}</small>
      </div>
      <div class="client-profile-kpi client-profile-paid">
        <span>Chiffre d’affaires encaissé</span>
        <strong>${presentation.totalLabel}</strong>
        <small>${presentation.relatedLabel}</small>
      </div>
      <div class="client-profile-kpi client-profile-pending">
        <span>À encaisser</span>
        <strong>${presentation.pendingLabel}</strong>
        <small>${escapeHtml(presentation.latestLabel)}</small>
      </div>
      <div class="client-profile-kpi">
        <span>Panier moyen réglé</span>
        <strong>${presentation.averageLabel}</strong>
        <small>${presentation.customerSinceLabel}</small>
      </div>
    </section>`;
}
