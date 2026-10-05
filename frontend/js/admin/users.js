// admin : users.

function filterAdminUsers() {
  const search = document.getElementById("adminUserSearch")?.value.trim().toLowerCase() || "";
  const filter = document.getElementById("adminVerificationFilter")?.value || "all";
  const subscription = document.getElementById("adminSubscriptionFilter")?.value || "all";
  const users = adminUsers.filter(user => (!search || user.email.toLowerCase().includes(search)) && (filter === "all" || (filter === "verified" ? user.isVerified : filter === "suspended" ? user.isSuspended : !user.isVerified)) && (subscription === "all" || (user.subscriptionStatus || "trial") === subscription));
  const container = document.getElementById("adminUsers");
  if (!container) return;
  container.innerHTML = users.length ? users.map(user => `<div style="background:#0f172a;padding:18px;border-radius:18px;margin-bottom:14px;border:1px solid rgba(255,255,255,.06);"><div style="color:white;font-size:16px;font-weight:700;margin-bottom:8px;">${escapeAdminHtml(user.email)}</div><div style="color:#94a3b8;font-size:14px;margin-bottom:6px;">Rôle : ${escapeAdminHtml(user.role)}</div><div style="color:${user.isVerified ? "#86efac" : "#fbbf24"};font-size:14px;">${user.isVerified ? "Compte vérifié" : "En attente de vérification"}${user.isSuspended ? " · Suspendu" : ""}</div><button onclick="showAdminUserSummary('${user._id}')" style="margin-top:12px;padding:8px 11px;border:1px solid #2563eb;border-radius:9px;background:#172554;color:#bfdbfe;cursor:pointer">Voir la synthèse</button>${user.role !== "admin" ? `<button onclick="toggleAdminSuspension('${user._id}',${!user.isSuspended})" style="margin:12px 0 0 8px;padding:8px 11px;border:0;border-radius:9px;background:${user.isSuspended ? "#166534" : "#991b1b"};color:white;cursor:pointer">${user.isSuspended ? "Réactiver" : "Suspendre"}</button>` : ""}</div>`).join("") : '<p style="color:#94a3b8">Aucun compte ne correspond aux filtres.</p>';
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

async function loadAdminUsers() {

  try {

    const stats = await adminApiFetch("/api/admin/stats");
    const statsContainer = document.getElementById("adminStats");
    if (statsContainer) statsContainer.innerHTML = [
      ["Utilisateurs", stats.totalUsers],
      ["Comptes vérifiés", stats.verifiedUsers],
      ["À vérifier", stats.pendingVerification],
      ["Essais en cours", stats.trials],
      ["Essais expirent bientôt", stats.trialsEndingSoon],
      ["Abonnements actifs", stats.activeSubscriptions],
      ["CA encaissé", `${Number(stats.revenue || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`]
    ].map(([label, value]) => `<div style="background:rgba(15,23,42,.78);border:1px solid rgba(255,255,255,.08);border-radius:22px;padding:24px"><div style="color:#94a3b8;font-size:13px;margin-bottom:9px">${label}</div><strong style="color:white;font-size:29px">${value}</strong></div>`).join("");

    const users =
      await adminApiFetch(
        "/api/admin/users"
      );

    adminUsers = users;

    document.getElementById(
      "totalUsers"
    ).innerText = users.length;

    filterAdminUsers();
    const audit = await adminApiFetch("/api/admin/audit");
    const auditContainer = document.getElementById("adminAudit");
    if (auditContainer) auditContainer.innerHTML = audit.length ? audit.map(event => `<div style="padding:12px 0;border-top:1px solid rgba(255,255,255,.08);"><strong style="color:#e2e8f0">${event.action === "admin.user_suspended" ? "Compte suspendu" : "Compte réactivé"}</strong><span style="margin-left:8px;color:#94a3b8">${escapeAdminHtml(event.metadata?.targetEmail || "")}</span><small style="display:block;margin-top:3px;color:#64748b">${new Date(event.createdAt).toLocaleString("fr-FR")}</small></div>`).join("") : "Aucune action administrateur enregistrée.";

  } catch (err) {

    if (err.sessionExpired) return;

    console.error(err);

    alert("Erreur admin");
  }
}
