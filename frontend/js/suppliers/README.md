# Fournisseurs

`suppliers.js` conserve la liste et l’identifiant en cours d’édition. Les scripts classiques suivants sont chargés dans `frontend/index.html`.

| Module | Responsabilité |
| --- | --- |
| `list.js` | Chargement, recherche, liens avec les produits et dépenses, suggestions. |
| `form.js` | Saisie, édition et ouverture d’une dépense préremplie. |
| `actions.js` | Demande de réassort et suppression avec confirmation. |
| `purchase-orders.js` | Affichage, impression, création, envoi et réception des bons. |

Les liens entre fournisseurs, produits et dépenses continuent de comparer les noms sans tenir compte de la casse. La réception conserve sa confirmation et recharge le stock après réussite de la requête. `window.purchaseOrders` reste utilisé par l’impression. Le numéro du bon et le nom du fournisseur sont échappés dans le document imprimé.

Les tests `backend/test/purchasing-ui.test.js` utilisent un DOM et une API simulés : contrats de sauvegarde, filtres, budgets, paiement, réassort, réception et impression. Aucun message ni bon de commande réel n’est envoyé. Une vérification visuelle reste distincte.
