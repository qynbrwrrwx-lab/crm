// Restauration de la session et de la section active.
window.onload = () => {
  if (!getToken()) return;

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
