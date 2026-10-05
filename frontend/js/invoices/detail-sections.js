// Sections de suivi de la fiche document, sans actions ni lignes commerciales.
function renderInvoiceDetailSupplementarySections(invoice, currentInvoice, presentation) {
  const {
    documentTypeLabel,
    electronicTransmission,
    documentStatus,
    statusClass,
    nextStep,
    clientName,
    timelineSteps
  } = presentation;
  const emailStatus = invoice.emailStatus;
  const emailDetail = emailStatus === "sent"
    ? `Remis au serveur le ${formatDocumentEmailDate(invoice.emailSentAt)} · ${escapeHtml(invoice.emailRecipient || invoice.contactId?.email || "adresse client")}`
    : emailStatus === "failed"
      ? `Dernier essai : ${formatDocumentEmailDate(invoice.emailFailedAt) || "inconnu"}${invoice.emailRecipient ? ` · ${escapeHtml(invoice.emailRecipient)}` : ""}`
      : invoice.contactId?.email
        ? `Le document sera envoyé à ${escapeHtml(invoice.contactId.email)}`
        : "Ajoutez une adresse e-mail dans la fiche client avant l’envoi.";
  const emailLabel = emailStatus === "sent"
    ? "Envoyé au client"
    : emailStatus === "failed"
      ? "Échec de l’envoi"
      : "Pas encore envoyé";
  const emailIcon = emailStatus === "sent" ? "✓" : emailStatus === "failed" ? "!" : "✉";
  const emailClass = emailStatus === "sent" ? "is-sent" : emailStatus === "failed" ? "is-failed" : "is-pending";

  return `
    <section class="document-detail-overview">
      <div class="document-detail-topline">
        <span class="document-status-pill ${statusClass}">${documentStatus}</span>
        <span class="document-items-count">${currentInvoice.products.length} article${currentInvoice.products.length > 1 ? "s" : ""}</span>
      </div>
      <div class="document-next-step"><span>Prochaine étape</span><strong>${escapeHtml(nextStep)}</strong></div>
      <div class="document-detail-metrics">
        <div><span>Client</span><strong>${escapeHtml(clientName)}</strong><small>${escapeHtml(invoice.contactId?.email || "Coordonnées client disponibles dans la fiche")}</small></div>
        <div><span>Date d’émission</span><strong>${new Date(invoice.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</strong><small>${documentTypeLabel} ${escapeHtml(invoice.invoiceNumber)}</small></div>
        <div class="document-detail-total"><span>Total TTC</span><strong>${formatDocumentCurrency(currentInvoice.totalTTC)}</strong><small>${formatDocumentCurrency(currentInvoice.totalHT)} HT</small></div>
      </div>
    </section>
    <section class="document-timeline" aria-label="Suivi du document">
      <div class="document-timeline-heading"><span>Suivi du document</span><small>Cycle commercial</small></div>
      <div class="document-timeline-steps">${timelineSteps.map((step, index) => `
        <div class="document-timeline-step ${step.complete ? "is-complete" : ""}">
          <span class="timeline-marker">${index + 1}</span><div><strong>${step.label}</strong><small>${escapeHtml(step.detail)}</small></div>
        </div>`).join("")}
      </div>
    </section>
    <section class="document-activity" aria-label="Historique des actions">
      <div class="document-timeline-heading"><span>Historique</span><small>Événements enregistrés</small></div>
      <div id="documentActivity"><p class="document-activity-empty">Chargement de l’historique…</p></div>
    </section>
    ${["quote", "order", "invoice", "credit_note"].includes(invoice.type) ? `
      <section class="document-email-delivery ${emailClass}" aria-label="Suivi de l’envoi e-mail">
        <div class="document-email-icon" aria-hidden="true">${emailIcon}</div>
        <div><span>Envoi par e-mail</span><strong>${emailLabel}</strong><small>${emailDetail}</small></div>
      </section>` : ""}
    ${electronicTransmission ? `
      <section class="document-electronic-delivery ${electronicTransmission.className}" aria-label="Suivi de la facturation électronique">
        <div class="document-electronic-icon" aria-hidden="true">${electronicTransmission.className === "rejected" || electronicTransmission.className === "error" ? "!" : "↗"}</div>
        <div><span>Facturation électronique</span><strong>${electronicTransmission.label}</strong><small>${invoice.electronicTransmission?.lastError ? escapeHtml(invoice.electronicTransmission.lastError) : "Le statut sera mis à jour automatiquement par votre plateforme agréée."}</small></div>
      </section>` : ""}
  `;
}
