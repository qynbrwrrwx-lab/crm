# Administration

`admin.js` conserve les états partagés. Les scripts classiques sont chargés dans l’ordre défini par les pages HTML, avec `bootstrap.js` en dernier.

| Module | Responsabilité |
| --- | --- |
| `api.js` | Accès API administrateur nommé adminApiFetch et déconnexion. |
| `shared.js` | Échappement HTML, montants et libellés. |
| `users.js` | Chargement des statistiques et comptes, filtres et export. |
| `actions.js` | Suspension, vérification et abonnement. |
| `summary.js` | Synthèse du compte. |
| `billing-modal.js` | Gabarit de la fenêtre de facturation d’abonnement. |
| `billing-presentation.js` | Lignes et actions affichées pour les factures d’abonnement. |
| `billing.js` | Factures d’abonnement, téléchargement et actions. |
| `bootstrap.js` | Chargement lorsque le conteneur adminUsers est présent. |

Les pages `index.html` et `admin-dashboard.html` conservent leurs points d’entrée. `adminApiFetch` est distinct de `apiFetch` : les appels administrateur ne dépendent plus de l’ordre de redéfinition d’une fonction globale. Le code d’affichage administrateur anciennement commenté est retiré. Les contrats API restent conservés.

`backend/test/app-admin-ui.test.js` couvre les sessions, confirmations, recherche, démarrage, filtres et actions administrateur dans un DOM avec API simulée. Aucun compte réel n’est modifié et aucun e-mail n’est envoyé. Une vérification visuelle reste distincte.
