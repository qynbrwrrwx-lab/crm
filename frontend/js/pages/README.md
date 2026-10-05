# Scripts des pages autonomes

Chaque fichier est chargé à la place du bloc script de la page HTML du même nom : `admin-login`, `forgot-password`, `resend-verification`, `reset-password`, `quote-client`, `reset` et `success`.

Les scripts gardent leur position de chargement, leurs routes et leur comportement. Les pages autonomes ne chargent pas les états de l’application principale. Le script historique `reset.js` reste distinct de `reset-password.js` pour conserver le contrat de sa page.

La page principale charge l’aperçu de session depuis `core/session-preview.js` dans son en-tête, puis les actions d’assistance depuis `auth/assistance.js` et les icônes depuis `core/icons.js` à la fin du document. Les anciennes copies de `login` et `register` ont été supprimées : les fonctions de `auth/access.js` restent les seules versions actives.

Les attributs événementiels HTML existants sont conservés. Cette extraction concerne les blocs script intégrés aux pages.
