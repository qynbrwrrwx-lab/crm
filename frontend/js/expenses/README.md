# Dépenses

`expenses.js` conserve les dépenses, les budgets et l’identifiant en cours d’édition. Les scripts classiques suivants sont chargés dans `frontend/index.html`.

| Module | Responsabilité |
| --- | --- |
| `shared.js` | Formatage des montants et des dates. |
| `list.js` | Chargement, indicateurs, filtres et liste des dépenses. |
| `form-data.js` | Lecture, remplissage et réinitialisation des champs de formulaire. |
| `form.js` | Saisie, édition, récurrence et informations fournisseur. |
| `actions.js` | Confirmation de paiement et suppression. |
| `budgets.js` | Budgets mensuels et répartition des charges par catégorie. |
| `csv.js` | Export CSV des dépenses. |

Le chargement actualise la trésorerie ; le rendu actualise le tableau de bord et les fournisseurs. Les variables et fonctions globales restent accessibles aux autres domaines. Les routes API, payloads et confirmations sont conservés.

Les tests `backend/test/purchasing-ui.test.js` utilisent un DOM et une API simulés : contrats de sauvegarde, filtres, budgets, paiement, réassort, réception et impression. Aucun message ni bon de commande réel n’est envoyé. Une vérification visuelle reste distincte.
