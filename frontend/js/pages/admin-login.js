// Connexion de la page d'administration autonome.

function setAdminLoginStatus(message, isError = false) {
  const status = document.getElementById("adminLoginStatus");
  if (!status) {
    if (message && isError) alert(message);
    return;
  }

  status.textContent = message;
  status.classList?.toggle("is-error", isError);
}

function setAdminLoginLoading(isLoading) {
  const submitButton = document.getElementById("adminLoginSubmit");
  if (submitButton) submitButton.disabled = isLoading;
}

async function adminLogin() {
  const form = document.getElementById("adminLoginForm");
  if (typeof form?.checkValidity === "function" && !form.checkValidity()) {
    form.reportValidity?.();
    return;
  }

  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;
  setAdminLoginLoading(true);
  setAdminLoginStatus("Connexion en cours…");

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) {
      setAdminLoginStatus(data.error || "Erreur connexion", true);
      return;
    }

    localStorage.setItem("token", data.token);
    window.location.href = "/admin";
  } catch (error) {
    console.error(error);
    setAdminLoginStatus("Erreur serveur", true);
  } finally {
    setAdminLoginLoading(false);
  }
}

document.getElementById("adminLoginForm")?.addEventListener("submit", event => {
  event.preventDefault();
  return adminLogin();
});
