# Produits et stock

Les scripts classiques sont chargés dans l’ordre défini dans `frontend/index.html`.
`products.js` conserve l’état partagé avec la navigation et les fournisseurs.

| Fichier | Responsabilité |
| --- | --- |
| `catalog.js` | Chargement, affichage, filtres et suppression du catalogue. |
| `form.js` | Création, édition, remise à zéro et aperçu du produit. |
| `stock.js` | Historique, fenêtre de réassort et validation des mouvements. |
| `activity.js` | Bilan commercial et documents associés au produit. |
| `csv.js` | Import et export du catalogue. |
| `replenishment.js` | Suggestions de réassort et préparation par fournisseur. |

`form.js` porte l’unique écouteur DOMContentLoaded du domaine. Les noms des fonctions utilisées par le HTML et les URL API sont conservés.

Les tests `backend/test/products-ui.test.js` vérifient les interactions dans un DOM simulé : filtres, formulaire, bilan commercial, réassort, CSV et échappement du texte. Ils ne remplacent pas une vérification visuelle dans le navigateur.
