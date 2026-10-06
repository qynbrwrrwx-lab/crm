// Formulaires autonomes d'assistance : lien de réinitialisation et vérification e-mail.

function initializeAccountRequest({ formId, endpoint, idleLabel }) {
  const form = document.getElementById(formId);
  const status = document.getElementById("status");
  const submitButton = document.getElementById("submitButton");
  const email = document.getElementById("email");
  if (!form || !status || !submitButton || !email) return;

  const setSubmitting = isSubmitting => {
    submitButton.disabled = isSubmitting;
    submitButton.querySelector("span").textContent = isSubmitting ? "Envoi en cours…" : idleLabel;
  };

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!email.checkValidity()) {
      email.reportValidity();
      return;
    }

    status.textContent = "";
    status.className = "status";
    setSubmitting(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Impossible d'envoyer le lien.");

      status.textContent = "Lien envoyé. Vérifiez votre boîte de réception et vos indésirables.";
      status.classList.add("success");
    } catch (error) {
      status.textContent = error.message;
    } finally {
      setSubmitting(false);
    }
  });
}
