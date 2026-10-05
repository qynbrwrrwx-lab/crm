/**
 * Fonctions texte partagées par l'interface.
 * Toute donnée issue d'un utilisateur doit passer par escapeHtml avant insertion
 * dans innerHTML afin d'éviter l'injection de contenu dans le navigateur.
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
