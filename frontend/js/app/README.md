# Application

`app.js` conserve les états partagés. Les scripts classiques sont chargés dans l’ordre défini par les pages HTML, avec `bootstrap.js` en dernier.

| Module | Responsabilité |
| --- | --- |
| `navigation.js` | Raccourcis de création depuis le tableau de bord. |
| `confirmation.js` | Fenêtre de confirmation et mot de passe éventuel. |
| `search.js` | Recherche globale, sélection et raccourcis clavier. |
| `api.js` | Accès API de l’application et gestion des sessions expirées. |
| `bootstrap.js` | Restauration de la session et de la section active. |

Les pages `index.html` et `admin-dashboard.html` conservent leurs points d’entrée. `adminApiFetch` est distinct de `apiFetch` : les appels administrateur ne dépendent plus de l’ordre de redéfinition d’une fonction globale. Le code d’affichage administrateur anciennement commenté est retiré. Les contrats API restent conservés.

`backend/test/app-admin-ui.test.js` couvre les sessions, confirmations, recherche, démarrage, filtres et actions administrateur dans un DOM avec API simulée. Aucun compte réel n’est modifié et aucun e-mail n’est envoyé. Une vérification visuelle reste distincte.
