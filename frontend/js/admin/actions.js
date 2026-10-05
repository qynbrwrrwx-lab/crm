// admin : actions.

async function toggleAdminSuspension(id, suspended) {
  if (!confirm(suspended ? "Suspendre ce compte ?" : "Réactiver ce compte ?")) return;
  await adminApiFetch(`/api/admin/users/${id}/suspension`, { method: "PUT", body: JSON.stringify({ suspended }) });
  await loadAdminUsers();
}

async function resendAdminVerification(id) {
  if (!confirm("Renvoyer un nouveau lien de vérification ?")) return;
  await adminApiFetch(`/api/admin/users/${id}/resend-verification`, { method: "POST" });
  alert("Lien de vérification envoyé.");
}

async function updateAdminSubscription(id) {
  const status = prompt("Statut : trial, active, suspended ou cancelled");
  if (!status) return;
  await adminApiFetch(`/api/admin/users/${id}/subscription`, { method: "PUT", body: JSON.stringify({ status: status.trim().toLowerCase() }) });
  await loadAdminUsers();
}
