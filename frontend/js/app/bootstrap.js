// Restauration de la session et de la section active.
async function restoreSession() {
  if (!getToken()) return;

  try {
    await apiFetch("/api/auth/session", { silent: true });
    return true;
  } catch (error) {
    return false;
  }
}

window.onload = async () => {
  if (!await restoreSession()) return;

  showApp();

  try {
    const savedSection = localStorage.getItem("my-prospect-active-section");
    if (savedSection && document.getElementById(savedSection)) {
      showSection(savedSection);
    }
  } catch (error) {
    // La session reste utilisable si le stockage local est indisponible.
  }
};
