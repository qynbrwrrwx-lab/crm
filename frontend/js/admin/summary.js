// admin : synthèse d'un compte.

function renderAdminUserSummary(summary, activity, trialEnd) {
  return `<section class="admin-summary-card"><button class="admin-modal-close" onclick="document.getElementById('adminSummaryModal').remove()">×</button><p class="admin-modal-eyebrow">Synthèse du compte</p><h2 class="admin-summary-title">${escapeAdminHtml(summary.user.email)}</h2><div class="admin-summary-grid"><div>Vérification<br><b>${summary.user.isVerified ? "Vérifié" : "En attente"}</b></div><div>Fin d’essai<br><b>${trialEnd}</b></div><div>Documents<br><b>${summary.documents}</b></div><div>Factures<br><b>${summary.invoices}</b></div><div>Dernière activité<br><b>${activity}</b></div></div><label class="admin-summary-label">Abonnement<select id="adminSubscriptionSelect" class="admin-summary-select"><option value="trial">Essai</option><option value="active">Actif</option><option value="suspended">Suspendu</option><option value="cancelled">Résilié</option></select></label><button id="adminSubscriptionSave" class="admin-modal-button admin-modal-button--primary">Enregistrer l’abonnement</button><button id="adminSubscriptionBilling" class="admin-modal-button admin-modal-button--billing">Facturation abonnement</button></section>`;
}

async function showAdminUserSummary(id) {
  const summary = await adminApiFetch(`/api/admin/users/${id}/summary`);
  const activity = summary.lastActivityAt ? new Date(summary.lastActivityAt).toLocaleDateString("fr-FR") : "Aucune activité";
  const trialEnd = summary.user.trialEndsAt ? new Date(summary.user.trialEndsAt).toLocaleDateString("fr-FR") : "Non définie";
  let modal = document.getElementById("adminSummaryModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "adminSummaryModal";
    modal.className = "admin-modal-overlay admin-summary-modal";
    document.body.append(modal);
  }
  modal.innerHTML = renderAdminUserSummary(summary, activity, trialEnd);
  document.getElementById("adminSubscriptionSelect").value = summary.user.subscriptionStatus || "trial";
  document.getElementById("adminSubscriptionSave").onclick = async () => { await adminApiFetch(`/api/admin/users/${id}/subscription`, { method: "PUT", body: JSON.stringify({ status: document.getElementById("adminSubscriptionSelect").value }) }); await loadAdminUsers(); document.getElementById("adminSummaryModal").remove(); };
  document.getElementById("adminSubscriptionBilling").onclick = () => openSubscriptionBilling(id, summary.user.email);
}
