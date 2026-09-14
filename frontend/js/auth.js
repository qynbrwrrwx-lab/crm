// ================= TOKEN =================

function getToken() {
  return localStorage.getItem("token");
}

function setToken(token) {
  localStorage.setItem("token", token);
}

function removeToken() {
  localStorage.removeItem("token");
}

// ================= REGISTER =================

async function register() {

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  if (password.length < 12) {
    showToast("Le mot de passe doit contenir au moins 12 caracteres");
    return;
  }

  showLoader();

  try {

    await apiFetch("/api/auth/register", {

      method: "POST",

      body: JSON.stringify({
        email,
        password
      })
    });

    showToast("📩 Vérifie ton email !");

  } catch (err) {

    showToast(err.message);
  }

  hideLoader();
}

// ================= LOGIN =================

async function login() {

  const email =
    document.getElementById("email").value;

  const password =
    document.getElementById("password").value;

  showLoader();

  try {

    const data =
      await apiFetch("/api/auth/login", {

        method: "POST",

        body: JSON.stringify({
          email,
          password
        })
      });
      
      setToken(data.token);

    showApp();

    showToast("Bienvenue 🚀");

  } catch (err) {

    showToast(err.message);
  }

  hideLoader();
}

// ================= LOGOUT =================

function logout() {

  removeToken();

  const app = document.getElementById("app");
  const auth = document.getElementById("auth");

  if (app) {
    app.style.display = "none";
  }

  if (auth) {
    auth.style.display = "flex";
  }

  if (map) {
    map.remove();
    map = null;
  }

  showToast("Déconnecté 👋");
}

// ================= RESET PASSWORD =================

async function resetPassword() {

  const password =
    document.getElementById("newPassword").value;

  if (password.length < 12) {
    showToast("Le mot de passe doit contenir au moins 12 caracteres");
    return;
  }

  const token =
    window.location.pathname.split("/").pop();

  try {

    const res = await fetch(

  `${API_URL}/api/auth/reset-password/${token}`,

  {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      password
    })
  }
);

    const data = await res.json();

    if (!res.ok) {

      alert(data.error || "Erreur");

      return;
    }

    alert("Mot de passe modifié ✅");

    window.location.href = "/";

  } catch (err) {

    console.error(err);

    alert("Erreur serveur");
  }
}

// ================= ADMIN LOGIN =================

async function adminLogin() {

  const email =
    document.getElementById(
      "adminEmail"
    ).value;

  const password =
    document.getElementById(
      "adminPassword"
    ).value;

  try {

    const data =
      await apiFetch(
        "/api/auth/login",
        {
          method: "POST",

          body: JSON.stringify({
            email,
            password
          })
        }
      );

    // TOKEN
    localStorage.setItem(
      "token",
      data.token
    );

    // REDIRECTION ADMIN
    window.location.href =
      "/admin";

  } catch (err) {

    alert(
      err.message
    );
  }
}

// ================= LOGOUT ADMIN =================

function logoutAdmin() {

  localStorage.removeItem(
    "token"
  );

  window.location.href =
    "/admin-login";
  }

async function exportAccountData() {
  try {
    const data = await apiFetch("/api/auth/export-data");
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `my-prospect-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Export téléchargé ✅");
  } catch (err) {
    showToast(err.message || "Impossible de télécharger les données");
  }
}

function escapeCsvValue(value) {
  return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`;
}

async function exportSalesCsv() {
  try {
    const documents = await apiFetch("/api/invoices");
    const salesDocuments = documents.filter(document =>
      ["invoice", "credit_note"].includes(document.type)
    );

    const lines = [
      ["Date", "Type", "Numero", "Client", "Total HT", "Total TTC", "Statut paiement", "Moyen de paiement", "Date paiement"],
      ...salesDocuments.map(document => [
        new Date(document.createdAt).toLocaleDateString("fr-FR"),
        document.type === "credit_note" ? "Avoir" : "Facture",
        document.invoiceNumber,
        document.contactId?.companyName || `${document.contactId?.firstname || ""} ${document.contactId?.lastname || ""}`.trim(),
        Number(document.totalHT || 0).toFixed(2),
        Number(document.totalTTC || 0).toFixed(2),
        document.paymentStatus === "paid" ? "Payee" : "En attente",
        document.paymentMethod || "",
        document.paidAt ? new Date(document.paidAt).toLocaleDateString("fr-FR") : ""
      ])
    ];

    const csv = `\uFEFF${lines.map(line => line.map(escapeCsvValue).join(";")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `my-prospect-ventes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Export CSV telecharge");
  } catch (err) {
    showToast(err.message || "Impossible d'exporter les ventes");
  }
}

async function loadAccountActivity() {
  const container = document.getElementById("accountActivity");
  if (!container) return;

  try {
    const events = await apiFetch("/api/auth/activity");
    const labels = {
      "user.login": "Connexion au compte",
      "user.password_changed": "Mot de passe modifié",
      "document.created": "Document créé",
      "quote.accepted": "Devis accepté",
      "invoice.paid": "Paiement enregistré",
      "invoice.credit_note_created": "Avoir créé",
      "document.email_sent": "Document envoyé par e-mail",
      "document.email_failed": "Échec d'envoi d'e-mail"
    };

    labels["document.converted_to_order"] = "Commande creee depuis un devis";
    labels["document.converted_to_invoice"] = "Facture creee depuis une commande";

    container.innerHTML = events.length
      ? events.map(event => `<div class="activity-row">
          <span>${escapeHtml(labels[event.action] || event.action)}</span>
          <small>${new Date(event.createdAt).toLocaleString("fr-FR")}</small>
        </div>`).join("")
      : '<p class="empty-state">Aucune activité récente.</p>';
  } catch (err) {
    container.innerHTML = '<p class="empty-state">Activité indisponible.</p>';
  }
}

async function changePassword() {
  const currentPassword = window.prompt("Saisissez votre mot de passe actuel.");
  if (!currentPassword) return;
  const newPassword = window.prompt("Saisissez votre nouveau mot de passe (12 caractères minimum).");
  if (!newPassword) return;

  try {
    await apiFetch("/api/auth/change-password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword })
    });
    showToast("Mot de passe modifié ✅");
    loadAccountActivity();
  } catch (err) {
    showToast(err.message || "Impossible de modifier le mot de passe");
  }
}

async function deleteAccount() {
  const confirmed = window.confirm(
    "Cette action supprimera définitivement votre compte et toutes vos données. Continuer ?"
  );
  if (!confirmed) return;

  const password = window.prompt("Saisissez votre mot de passe pour confirmer la suppression.");
  if (!password) return;

  try {
    await apiFetch("/api/auth/delete-account", {
      method: "DELETE",
      body: JSON.stringify({ password })
    });
    localStorage.removeItem("token");
    showToast("Compte supprimé");
    setTimeout(() => window.location.reload(), 800);
  } catch (err) {
    showToast(err.message || "Impossible de supprimer le compte");
  }
}
