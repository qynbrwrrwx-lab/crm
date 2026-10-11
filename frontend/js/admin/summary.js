// admin : synthèse d'un compte.

function getAdminUserSummaryPresentation(summary) {
  return {
    email: summary.user.email,
    verificationLabel: summary.user.isVerified ? "Vérifié" : "En attente",
    trialEndLabel: summary.user.trialEndsAt ? new Date(summary.user.trialEndsAt).toLocaleDateString("fr-FR") : "Non définie",
    documents: summary.documents,
    invoices: summary.invoices,
    activityLabel: summary.lastActivityAt ? new Date(summary.lastActivityAt).toLocaleDateString("fr-FR") : "Aucune activité",
    subscriptionStatus: summary.user.subscriptionStatus || "trial"
  };
}

function renderAdminUserSummary(summary) {
  const item = getAdminUserSummaryPresentation(summary);
  return `<section class="admin-summary-card"><button class="admin-modal-close" onclick="document.getElementById('adminSummaryModal').remove()">×</button><p class="admin-modal-eyebrow">Synthèse du compte</p><h2 class="admin-summary-title">${escapeAdminHtml(item.email)}</h2><div class="admin-summary-grid"><div>Vérification<br><b>${item.verificationLabel}</b></div><div>Fin d’essai<br><b>${item.trialEndLabel}</b></div><div>Documents<br><b>${item.documents}</b></div><div>Factures<br><b>${item.invoices}</b></div><div>Dernière activité<br><b>${item.activityLabel}</b></div></div><label class="admin-summary-label">Abonnement<select id="adminSubscriptionSelect" class="admin-summary-select"><option value="trial">Essai</option><option value="active">Actif</option><option value="suspended">Suspendu</option><option value="cancelled">Résilié</option></select></label><button id="adminSubscriptionSave" class="admin-modal-button admin-modal-button--primary">Enregistrer l’abonnement</button><button id="adminSubscriptionBilling" class="admin-modal-button admin-modal-button--billing">Facturation abonnement</button></section>`;
}

async function showAdminUserSummary(id) {
  const summary = await adminApiFetch(`/api/admin/users/${id}/summary`);
  const presentation = getAdminUserSummaryPresentation(summary);
  let modal = document.getElementById("adminSummaryModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "adminSummaryModal";
    modal.className = "admin-modal-overlay admin-summary-modal";
    document.body.append(modal);
  }
  modal.innerHTML = renderAdminUserSummary(summary);
  document.getElementById("adminSubscriptionSelect").value = presentation.subscriptionStatus;
  document.getElementById("adminSubscriptionSave").onclick = async () => { await adminApiFetch(`/api/admin/users/${id}/subscription`, { method: "PUT", body: JSON.stringify({ status: document.getElementById("adminSubscriptionSelect").value }) }); await loadAdminUsers(); document.getElementById("adminSummaryModal").remove(); };
  document.getElementById("adminSubscriptionBilling").onclick = () => openSubscriptionBilling(id, summary.user.email);
}
