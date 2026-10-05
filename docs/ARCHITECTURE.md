# Architecture de My Prospect

Ce document décrit l'organisation du projet et les règles à respecter lors de toute évolution. L'objectif est qu'un développeur puisse localiser une fonctionnalité et la modifier sans introduire de régression.

## Vue d'ensemble

My Prospect est une application JavaScript composée de deux parties :

- `backend/` : API Node.js / Express, accès MongoDB via Mongoose et génération de documents ou e-mails.
- `frontend/` : interface HTML, CSS et JavaScript servie par l'API.

Le navigateur appelle uniquement les routes `/api/...`. Les règles métier et les contrôles de sécurité restent côté backend.

## Backend

| Dossier | Responsabilité |
| --- | --- |
| `config/` | Connexions techniques, notamment MongoDB. |
| `middleware/` | Authentification, contrôle administrateur et protections communes. |
| `models/` | Schémas Mongoose et contraintes de persistance. |
| `routes/` | Contrat HTTP de chaque domaine fonctionnel. Une route valide l'entrée, applique les droits puis appelle les services nécessaires. |
| `controllers/` | Règles métier associées aux routes. Voir l'[index des contrôleurs](../backend/controllers/README.md). |
| `services/` | Logique réutilisable : e-mail, PDF, journal d'audit et numérotation. |
| `scripts/` | Migrations ponctuelles, exécutées explicitement. |
| `test/` | Tests automatisés de sécurité et de modèles. |

Les domaines sont séparés par fichier (`contactRoutes`, `invoiceRoutes`, `treasuryRoutes`, `supplierRoutes`, etc.). Lorsqu'un fichier de routes devient trop important, sa logique métier doit être déplacée vers un service ou un contrôleur dédié sans modifier son URL publique.

## Frontend

| Emplacement | Responsabilité |
| --- | --- |
| `frontend/index.html` | Structure principale de l'application connectée. |
| `frontend/*.html` | Pages indépendantes : administration, lien client de devis, assistance de compte. |
| `frontend/style.css` | Système visuel partagé et styles par écran. |
| `frontend/js/app.js` | Initialisation, navigation, session et appels partagés. |
| `frontend/js/core/` | Noyau partagé sans logique métier : protection du texte affiché et formatage cohérent. |
| `frontend/js/ui.js`, `frontend/js/ui/` | Retours utilisateur, démarrage, navigation, raccourcis et favoris. Voir le [guide interface](../frontend/js/ui/README.md). |
| `frontend/js/invoices.js`, `frontend/js/invoices/` | État partagé des documents et scripts spécialisés : listes, formulaires, paiements, conversions, envois, fiche et édition. Voir le [guide du module](../frontend/js/invoices/README.md). |
| `frontend/js/contacts.js`, `frontend/js/contacts/` | État des clients, formulaire, liste, fiche, CSV et actions. Voir le [guide des contacts](../frontend/js/contacts/README.md). |
| `frontend/js/auth.js`, `frontend/js/auth/`, `frontend/js/auth-pages.js` | Session, accès, compte, mots de passe et pages d’assistance. Voir le [guide d’authentification](../frontend/js/auth/README.md). |
| `frontend/js/products.js`, `frontend/js/products/` | Catalogue, formulaires, stock, activité commerciale et CSV. Voir le [guide produits](../frontend/js/products/README.md). |
| `frontend/js/dashboard.js`, `frontend/js/dashboard/` | Indicateurs, trésorerie, alertes, activité, graphiques et démarrage. Voir le [guide du tableau de bord](../frontend/js/dashboard/README.md). |
| `frontend/js/company.js`, `frontend/js/company/` | Profil entreprise, formulaire, réglages des e-mails, préparation électronique et logo. Voir le [guide entreprise](../frontend/js/company/README.md). |
| `frontend/js/expenses.js`, `frontend/js/expenses/` | Dépenses, paiements, budgets et export CSV. Voir le [guide dépenses](../frontend/js/expenses/README.md). |
| `frontend/js/suppliers.js`, `frontend/js/suppliers/` | Fournisseurs, réassort et bons de commande. Voir le [guide fournisseurs](../frontend/js/suppliers/README.md). |
| `frontend/js/treasury.js`, `frontend/js/treasury/` | Soldes, mouvements, CSV, rapprochements, prévisions et graphique. Voir le [guide trésorerie](../frontend/js/treasury/README.md). |
| `frontend/js/tasks.js`, `frontend/js/tasks/` | Agenda, rendez-vous, rappels et actions. Voir le [guide agenda](../frontend/js/tasks/README.md). |
| `frontend/js/opportunities.js`, `frontend/js/opportunities/` | Pipeline, statistiques, formulaires et relances. Voir le [guide opportunités](../frontend/js/opportunities/README.md). |
| `frontend/js/app.js`, `frontend/js/app/` | États, navigation, recherche, confirmations, API et démarrage. Voir le [guide application](../frontend/js/app/README.md). |
| `frontend/js/admin.js`, `frontend/js/admin/` | Comptes, accès API administrateur et factures d’abonnement. Voir le [guide administration](../frontend/js/admin/README.md). |
| `frontend/js/pages/` | Scripts extraits des pages autonomes. Voir le [guide des pages](../frontend/js/pages/README.md). |
| `frontend/js/<domaine>.js` | Une fonctionnalité métier par module : contacts, produits, factures, trésorerie, fournisseurs, agenda, etc. |

Le frontend ne doit pas être considéré comme une barrière de sécurité. Toute donnée affichée provenant d'un utilisateur doit être échappée avant insertion HTML, et l'API doit toujours contrôler le `userId` de l'utilisateur connecté.

## Règles non négociables

1. Toute donnée métier privée doit être filtrée par `userId` dans chaque lecture, modification et suppression.
2. Les montants, statuts et stocks sont validés côté API. Une validation HTML améliore l'expérience mais ne remplace jamais cette validation.
3. Les documents émis conservent leurs lignes et montants historiques ; ne jamais recalculer un ancien document à partir d'un produit modifié.
4. Les routes publiques ne révèlent ni jeton, ni mot de passe, ni détail d'erreur interne.
5. Les secrets restent dans `backend/.env` ou dans l'hébergeur : jamais dans Git, le frontend ou un PDF.
6. Une modification fonctionnelle inclut une vérification automatisée et, si nécessaire, un scénario de recette manuel.

## Flux principal

`Devis -> accepté -> commande -> facture -> paiement / avoir`

Les transitions sont vérifiées côté backend afin d'empêcher les doublons. Le stock est décrémenté à la commande et chaque réassort ou réception fournisseur produit un mouvement de stock historisé.

## Évolution prévue de l'organisation

Le dépôt est en cours de refactorisation progressive. Les comportements en production, les URLs `/api` et les collections MongoDB sont conservés. Chaque domaine est remis en forme, documenté et testé indépendamment avant de passer au suivant.
