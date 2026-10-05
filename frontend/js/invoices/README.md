# Interface des documents commerciaux

Le fichier `../invoices.js` déclare l'état partagé. Les scripts de ce dossier contiennent les fonctions de l'interface, chargées explicitement dans `frontend/index.html` avant `app.js`.

| Fichier | Responsabilité |
| --- | --- |
| `shared.js` | Formatage, échéances, statuts et état des boutons pendant une action. |
| `list.js` | Chargement, lecture des filtres, mise à jour des listes et onglets. |
| `list-selection.js` | Sélection, tri et compteurs des documents, sans accès au DOM. |
| `list-row.js` | Génération du HTML d’une ligne de document. |
| `forms.js` | Envoi à l’API des créations de factures et créations/modifications de devis. |
| `form-data.js` | Chargement des clients et produits, contexte client et récapitulatif du devis. |
| `quote-form.js` | Ouverture et fermeture du formulaire de devis, édition et ajout de lignes. |
| `export.js` | Export CSV des factures et avoirs via les outils partagés de `core/csv.js`. |
| `payments.js` | Fenêtre de règlement, validation du montant, acomptes et avoirs. |
| `workflow.js` | Acceptation, duplication, suppression, conversions et suivi de commande. |
| `delivery.js` | E-mails, relances, ouverture des PDF et bons de livraison. |
| `details.js` | Ouverture et fermeture de la fiche, chargement de l’historique et copie du numéro. |
| `detail-presentation.js` | Préparation des libellés, statuts, étapes et références liées, sans accès au DOM. |
| `detail-template.js` | Construction du HTML avec données explicites et échappement du texte client. |
| `editor.js` | Édition des lignes, choix des produits et recalcul des totaux. |

## Chargement et compatibilité

Ces fichiers utilisent des scripts classiques, sans `type="module"`, `async` ni `defer`. Les fonctions restent accessibles aux attributs `onclick` existants. Charger les formateurs `core/`, puis `invoices.js`, puis les scripts dans l'ordre déclaré dans `index.html`, avant l'initialisation de `app.js`.

Les variables ne doivent être déclarées qu'une fois dans `invoices.js`. `allInvoices` est également lu par le tableau de bord, la trésorerie et la navigation. `documentActionLocks` est partagé pour empêcher plusieurs envois simultanés d'une même action. `currentInvoice` contient la copie de travail du document ouvert.

L'initialisation des scripts ne lance aucun appel API. Les données sont chargées lorsque l'application appelle les fonctions correspondantes. Ne pas déplacer les contrôles métier du serveur vers ces scripts.

## Vérification

Depuis la racine du projet, exécuter `npm test --prefix backend`. `backend/test/invoice-ui.test.js` charge les scripts indiqués par le HTML dans un contexte JavaScript partagé et simule le DOM ainsi que les réponses API. Il contrôle les listes, filtres, conversions, paiements, formulaires, fiches détaillées, prix historiques et ouverture des PDF. Les tests ne remplacent pas une recette visuelle dans un navigateur.

Après l'ajout d'un fichier, l'inclure explicitement dans `index.html` et vérifier la syntaxe de tous les fichiers JavaScript, y compris ceux de ce dossier.
