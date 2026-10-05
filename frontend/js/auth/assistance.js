async function resendEmail() {

  const email =
    document.getElementById("email").value;

  if (!email) {
    return showToast("Entre ton email 📧");
  }

  try {
    await apiFetch("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email })
    });
    showToast("Lien de validation envoyé. Vérifie aussi les indésirables.");
  } catch (err) {
    showToast(err.message || "Impossible d'envoyer le lien de validation.");
  }
}

async function requestReset() {

  const email =
    document.getElementById("email").value;

  if (!email) {
    return showToast("Entre ton email 📧");
  }

  try {
    await apiFetch("/api/auth/request-reset", {
      method: "POST",
      body: JSON.stringify({ email })
    });
    showToast("Lien de réinitialisation envoyé. Vérifie aussi les indésirables.");
  } catch (err) {
    showToast(err.message || "Impossible d'envoyer le lien de réinitialisation.");
  }
}
