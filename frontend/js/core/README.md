# Utilitaires partagés

- `text.js` : échappement des textes.
- `formatters.js` : formatage des dates et montants.
- `csv.js` : échappement, téléchargement et lecture CSV.
- `session-preview.js` : indication de restauration de session, chargée dans l’en-tête.
- `icons.js` : création des icônes après le contenu HTML.

Les exports de dépenses et de trésorerie utilisent `escapeCsvValue` pour les cellules. Leur assemblage, leurs noms de fichiers, leurs montants et leurs signes restent conservés.

`backend/test/html-core-ui.test.js` vérifie les références des scripts, l’aperçu de session, les actions d’assistance, la réinitialisation, la redirection et les exports CSV avec des objets de navigateur simulés. Une vérification visuelle reste distincte.
