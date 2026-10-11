// admin : utilisateurs, statistiques et journal.

function getAdminUserPresentation(user) {
  const status = user.isSuspended ? "suspended" : user.isVerified ? "verified" : "pending";
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    status,
    statusLabel: user.isSuspended ? "Compte suspendu" : user.isVerified ? "Compte vérifié" : "En attente de vérification",
    canToggleSuspension: user.role !== "admin",
    suspensionAction: user.isSuspended ? "Réactiver" : "Suspendre",
    suspensionClass: user.isSuspended ? "admin-user-action--restore" : "admin-user-action--suspend",
    nextSuspended: !user.isSuspended
  };
}

function renderAdminUser(user) {
  const item = getAdminUserPresentation(user);
  const suspensionButton = item.canToggleSuspension ? `<button class="admin-user-action ${item.suspensionClass}" onclick="toggleAdminSuspension('${item.id}',${item.nextSuspended})">${item.suspensionAction}</button>` : "";
  return `<article class="admin-user-card"><div class="admin-user-email">${escapeAdminHtml(item.email)}</div><div class="admin-user-role">Rôle : ${escapeAdminHtml(item.role)}</div><div class="admin-user-status admin-user-status--${item.status}">${item.statusLabel}</div><button class="admin-user-action admin-user-action--summary" onclick="showAdminUserSummary('${item.id}')">Voir la synthèse</button>${suspensionButton}</article>`;
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

function getAdminStatsPresentation(stats) {
  return [
    { label: "Utilisateurs", value: stats.totalUsers, isTotal: true },
    { label: "Comptes vérifiés", value: stats.verifiedUsers },
    { label: "À vérifier", value: stats.pendingVerification },
    { label: "Essais en cours", value: stats.trials },
    { label: "Essais expirent bientôt", value: stats.trialsEndingSoon },
    { label: "Abonnements actifs", value: stats.activeSubscriptions },
    { label: "CA encaissé", value: `${Number(stats.revenue || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €` }
  ];
}

function renderAdminStats(stats) {
  return getAdminStatsPresentation(stats)
    .map(item => `<div class="admin-stat-card"><div class="admin-stat-label admin-stat-label--compact">${item.label}</div><strong${item.isTotal ? ' id="totalUsers"' : ""} class="admin-stat-live-value">${item.value}</strong></div>`)
    .join("");
}

function getAdminAuditPresentation(audit) {
  return {
    emptyMessage: "Aucune action administrateur enregistrée.",
    entries: audit.map(event => ({
      actionLabel: event.action === "admin.user_suspended" ? "Compte suspendu" : "Compte réactivé",
      targetEmail: event.metadata?.targetEmail || "",
      dateLabel: new Date(event.createdAt).toLocaleString("fr-FR")
    }))
  };
}

function renderAdminAudit(audit) {
  const presentation = getAdminAuditPresentation(audit);
  if (!presentation.entries.length) return presentation.emptyMessage;
  return presentation.entries.map(item => `<div class="admin-audit-entry"><strong class="admin-audit-action">${item.actionLabel}</strong><span class="admin-audit-target">${escapeAdminHtml(item.targetEmail)}</span><small class="admin-audit-time">${item.dateLabel}</small></div>`).join("");
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
