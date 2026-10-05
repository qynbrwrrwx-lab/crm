# Interface des clients

`../contacts.js` conserve l'état partagé (`allContacts`, `editingContactId`) et la normalisation des étiquettes. Les scripts de ce dossier sont chargés explicitement dans `frontend/index.html`, après les outils `core/` et avant `app.js`.

| Fichier | Responsabilité |
| --- | --- |
| `form.js` | Création et édition, validation du formulaire, aperçu, adresse de livraison et initialisation des événements. |
| `list.js` | Chargement, cartes clients, recherche, filtres, tri et synchronisation de la carte géographique. |
| `profile.js` | Fiche client, historique commercial, agenda, opportunités et navigation associée. |
| `csv.js` | Export et import CSV, confirmation et rapport des lignes échouées. |
| `actions.js` | Suppression et ajout aux favoris. |

Les scripts restent classiques afin de conserver les fonctions utilisées dans les boutons HTML. Ne pas ajouter `async` ni les convertir individuellement en modules sans adapter le chargement. Le formulaire enregistre un seul gestionnaire `DOMContentLoaded`. `allContacts` est aussi utilisé par l'agenda, les opportunités et la navigation. `celebrateFormCard` reste accessible au formulaire des produits.

La fiche utilise le formateur monétaire partagé de `core/formatters.js`. Les textes clients sont échappés avant insertion dans les cartes et les bulles géographiques.

Exécuter `npm test --prefix backend` depuis la racine du projet. `contacts-ui.test.js` charge les scripts déclarés par la page avec un DOM et des réponses API simulés ; aucun e-mail, import réel ni appel de géocodage n'est effectué. La validation visuelle dans un navigateur reste complémentaire.
