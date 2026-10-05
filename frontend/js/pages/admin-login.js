// Connexion de la page d'administration autonome.

async function adminLogin() {
  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data.error || "Erreur connexion");
      return;
    }

    localStorage.setItem("token", data.token);
    window.location.href = "/admin";
  } catch (error) {
    console.error(error);
    alert("Erreur serveur");
  }
}
