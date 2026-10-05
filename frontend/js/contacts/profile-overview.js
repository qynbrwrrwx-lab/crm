// Clients : synthèse commerciale de la fiche profil.

function renderClientProfileOverview(contact, { firstPaidInvoice, latest, paidInvoices, pending, related, total }) {
  return `    <section class="client-profile-overview">
      <div class="client-profile-contact-card">
        <span>Coordonnées</span>
        <strong>${escapeHtml(contact.email || "E-mail non renseigné")}</strong>
        <small>${escapeHtml(contact.phone || "Téléphone non renseigné")}</small>
        <small class="client-profile-address">${escapeHtml(contact.billingAddress || "Adresse de facturation non renseignée")}</small>
      </div>
      <div class="client-profile-kpi client-profile-paid">
        <span>Chiffre d’affaires encaissé</span>
        <strong>${formatCurrency(total)}</strong>
        <small>${related.length} document${related.length > 1 ? "s" : ""} associé${related.length > 1 ? "s" : ""}</small>
      </div>
      <div class="client-profile-kpi client-profile-pending">
        <span>À encaisser</span>
        <strong>${formatCurrency(pending)}</strong>
        <small>${latest ? `Dernier document : ${escapeHtml(latest.invoiceNumber)}` : "Aucune activité commerciale"}</small>
      </div>
      <div class="client-profile-kpi">
        <span>Panier moyen réglé</span>
        <strong>${formatCurrency(paidInvoices.length ? total / paidInvoices.length : 0)}</strong>
        <small>${firstPaidInvoice ? `Client depuis le ${new Date(firstPaidInvoice.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}` : "Aucune facture réglée"}</small>
      </div>
    </section>`;
}
