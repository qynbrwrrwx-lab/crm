// admin : utilisateurs, statistiques et journal.

function renderAdminUser(user) {
  const status = user.isSuspended ? "suspended" : user.isVerified ? "verified" : "pending";
  const statusLabel = user.isSuspended ? "Compte suspendu" : user.isVerified ? "Compte vérifié" : "En attente de vérification";
  const suspensionAction = user.isSuspended ? "Réactiver" : "Suspendre";
  const suspensionClass = user.isSuspended ? "admin-user-action--restore" : "admin-user-action--suspend";
  const suspensionButton = user.role === "admin" ? "" : `<button class="admin-user-action ${suspensionClass}" onclick="toggleAdminSuspension('${user._id}',${!user.isSuspended})">${suspensionAction}</button>`;

  return `<article class="admin-user-card"><div class="admin-user-email">${escapeAdminHtml(user.email)}</div><div class="admin-user-role">Rôle : ${escapeAdminHtml(user.role)}</div><div class="admin-user-status admin-user-status--${status}">${statusLabel}</div><button class="admin-user-action admin-user-action--summary" onclick="showAdminUserSummary('${user._id}')">Voir la synthèse</button>${suspensionButton}</article>`;
}

function filterAdminUsers() {
  const search = document.getElementById("adminUserSearch")?.value.trim().toLowerCase() || "";
  const filter = document.getElementById("adminVerificationFilter")?.value || "all";
  const subscription = document.getElementById("adminSubscriptionFilter")?.value || "all";
  const users = adminUsers.filter(user => (!search || user.email.toLowerCase().includes(search)) && (filter === "all" || (filter === "verified" ? user.isVerified : filter === "suspended" ? user.isSuspended : !user.isVerified)) && (subscription === "all" || (user.subscriptionStatus || "trial") === subscription));
  const container = document.getElementById("adminUsers");
  if (!container) return;
  container.innerHTML = users.length ? users.map(renderAdminUser).join("") : '<p class="admin-empty-state">Aucun compte ne correspond aux filtres.</p>';
}

function exportAdminUsersCsv() {
  const search = document.getElementById("adminUserSearch")?.value.trim().toLowerCase() || "";
  const filter = document.getElementById("adminVerificationFilter")?.value || "all";
  const rows = adminUsers.filter(user => (!search || user.email.toLowerCase().includes(search)) && (filter === "all" || (filter === "verified" ? user.isVerified : filter === "suspended" ? user.isSuspended : !user.isVerified))).map(user => [user.email, user.role, user.isSuspended ? "Suspendu" : user.isVerified ? "Vérifié" : "À vérifier", new Date(user.createdAt).toLocaleDateString("fr-FR")]);
  const csv = [["E-mail", "Rôle", "Statut", "Inscription"], ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: "my-prospect-comptes.csv" });
  link.click(); URL.revokeObjectURL(url);
}

function renderAdminStats(stats) {
  return [
    ["Utilisateurs", stats.totalUsers],
    ["Comptes vérifiés", stats.verifiedUsers],
    ["À vérifier", stats.pendingVerification],
    ["Essais en cours", stats.trials],
    ["Essais expirent bientôt", stats.trialsEndingSoon],
    ["Abonnements actifs", stats.activeSubscriptions],
    ["CA encaissé", `${Number(stats.revenue || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`]
  ].map(([label, value], index) => `<div class="admin-stat-card"><div class="admin-stat-label admin-stat-label--compact">${label}</div><strong${index === 0 ? ' id="totalUsers"' : ""} class="admin-stat-live-value">${value}</strong></div>`).join("");
}

function renderAdminAudit(audit) {
  if (!audit.length) return "Aucune action administrateur enregistrée.";
  return audit.map(event => `<div class="admin-audit-entry"><strong class="admin-audit-action">${event.action === "admin.user_suspended" ? "Compte suspendu" : "Compte réactivé"}</strong><span class="admin-audit-target">${escapeAdminHtml(event.metadata?.targetEmail || "")}</span><small class="admin-audit-time">${new Date(event.createdAt).toLocaleString("fr-FR")}</small></div>`).join("");
}

async function loadAdminUsers() {
  try {
    const stats = await adminApiFetch("/api/admin/stats");
    const statsContainer = document.getElementById("adminStats");
    if (statsContainer) statsContainer.innerHTML = renderAdminStats(stats);

    const users = await adminApiFetch("/api/admin/users");
    adminUsers = users;
    document.getElementById("totalUsers").innerText = users.length;

    filterAdminUsers();
    const audit = await adminApiFetch("/api/admin/audit");
    const auditContainer = document.getElementById("adminAudit");
    if (auditContainer) auditContainer.innerHTML = renderAdminAudit(audit);
  } catch (err) {
    if (err.sessionExpired) return;
    console.error(err);
    alert("Erreur admin");
  }
}
