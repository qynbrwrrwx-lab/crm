# Contrôleurs backend

Un contrôleur reçoit une requête depuis `routes/`, applique les règles métier, interroge les modèles et produit la réponse HTTP. Les routes privées appliquent d'abord leurs middlewares d'authentification ; les routes publiques d'inscription, de connexion et de liens par jeton restent publiques. Les routes ne doivent contenir ni calcul métier, ni accès direct aux collections.

| Contrôleur | Domaine |
| --- | --- |
| `authenticationController.js` | Inscription et connexion ; émission de la session et audit de connexion. |
| `passwordResetController.js` | Demande de réinitialisation et changement de mot de passe par jeton. |
| `emailVerificationController.js` | Renvoi du lien de vérification et validation de l'adresse e-mail. |
| `adminController.js` | Administration des comptes et abonnements. |
| `companyController.js` | Profil de l'entreprise, paramètres d'e-mail et préparation à la facturation électronique. |
| `contactController.js` | Clients, favoris, relances et protections avant suppression. |
| `electronicInvoicingController.js` | État de préparation à la facturation électronique. |
| `expenseBudgetController.js` | Budgets mensuels par catégorie. |
| `expenseController.js` | Dépenses, règlements et récurrences mensuelles. |
| `opportunityController.js` | Pipeline commercial et probabilités par étape. |
| `productController.js` | Catalogue, prix, stock et mouvements de stock. |
| `publicQuoteController.js` | Consultation et réponse client à un devis par lien sécurisé. |
| `purchaseOrderController.js` | Bons de commande fournisseurs, envoi et réception de stock. |
| `supplierController.js` | Fournisseurs et demandes de réassort. |
| `treasuryController.js` | Réglages de trésorerie, mouvements et import anti-doublon. |
| `accountController.js` | Export, activité, mot de passe et suppression du compte connecté. |
| `taskController.js` | Tâches, rendez-vous et récurrences. |
| `documentReadController.js` | Liste et activité des documents commerciaux. |
| `commercialDocumentCreationController.js`, `commercialDocumentUpdateController.js` | Création des documents et modification des devis autorisés. |
| `commercialDocumentDuplicateController.js`, `commercialDocumentDeletionController.js` | Duplication des devis et suppression des brouillons. |
| `commercialDocumentWorkflowController.js` | Acceptation des devis et suivi des commandes. |
| `quoteConversionController.js`, `orderConversionController.js` | Devis vers commande avec contrôle du stock ; commande vers facture avec déduction des acomptes payés. |
| `depositInvoiceController.js`, `invoicePaymentController.js`, `creditNoteController.js` | Factures d'acompte, paiements et avoirs. |
| `commercialDocumentPdfController.js`, `commercialDocumentEmailController.js` | Génération PDF, envoi des documents et relances. |
| `deliveryNoteController.js` | Génération et envoi des bons de livraison. |

Les jetons de vérification et de réinitialisation sont créés par `services/authSecurityService.js` : aléa de 32 octets, empreinte SHA-256 conservée en base et expiration après une heure. Le jeton brut sert uniquement à construire le lien envoyé par e-mail. Les contrôleurs effacent son empreinte et sa date d'expiration après utilisation réussie.

Les tests `authentication-flows.test.js` et `commercial-conversions.test.js` exercent les gestionnaires enregistrés dans les routes avec les accès aux modèles et l'envoi d'e-mail simulés. Ils complètent les tests de sécurité et de modèles ; ils ne remplacent pas une recette avec MongoDB et un navigateur.

Pour ajouter un domaine, créer d'abord son contrôleur ici, conserver les URLs dans `routes/`, puis exécuter `npm test --prefix backend` et `git diff --check`.
