// auth/account.js: fonctions extraites sans changement de comportement.

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

function getAccountDeletionPresentation() {
  return {
    confirmation: {
      title: "Supprimer votre compte ?",
      message: "Cette action supprimera définitivement votre compte et toutes vos données.",
      actionLabel: "Supprimer mon compte",
      danger: true,
      passwordRequired: true
    },
    successMessage: "Compte supprimé"
  };
}

async function deleteAccount() {
  const presentation = getAccountDeletionPresentation();
  const password = await confirmAppAction(presentation.confirmation);
  if (!password) return;

  try {
    await apiFetch("/api/auth/delete-account", {
      method: "DELETE",
      body: JSON.stringify({ password })
    });
    localStorage.removeItem("token");
    showToast(presentation.successMessage);
    setTimeout(() => window.location.reload(), 800);
  } catch (err) {
    showToast(err.message || "Impossible de supprimer le compte");
  }
}
