# Interface d'authentification et de compte

`../auth.js` contient les fonctions de session partagées : lecture, écriture et suppression du jeton, ainsi que la déconnexion de l'application. Les fonctions restent globales pour les boutons HTML et les autres écrans.

| Fichier | Responsabilité |
| --- | --- |
| `access.js` | Inscription, connexion utilisateur et administrateur, visibilité du mot de passe de connexion. |
| `password.js` | Réinitialisation par lien et changement de mot de passe depuis le compte. |
| `account.js` | Export JSON du compte, activité récente et suppression confirmée du compte. |
| `reset-page.js` | HTML de la page de réinitialisation rendue par l'application principale. |
| `verification-pending-page.js` | HTML de la page de vérification en attente. |
| `verification-result-pages.js` | HTML des résultats de vérification : succès, déjà utilisé, erreur. |

`../auth-pages.js` sélectionne le modèle d'assistance selon le chemin courant. Les modèles doivent être chargés avant ce script ; leur chargement seul ne modifie pas le DOM. La page principale conserve l'ordre explicite de ses scripts classiques. Les pages HTML autonomes (`reset-password.html`, `forgot-password.html`, etc.) conservent leur propre fonctionnement : ce découpage ne change pas les routes du serveur.

Les imports et exports CSV génériques sont dans `../core/csv.js`, chargés avant les domaines qui les utilisent. L'export des ventes appartient à `../invoices/export.js`.

## Vérification

`npm test --prefix backend` inclut `auth-ui.test.js`, avec DOM, stockage, API et téléchargements simulés. Ces tests couvrent les sessions, les erreurs de connexion, les pages d'assistance, les confirmations de mot de passe et le CSV. Ils ne déclenchent ni connexion réelle ni suppression de compte.

Les règles d'autorisation restent côté serveur. Ne pas déplacer le jeton dans le HTML des pages d'assistance ni modifier les clés du stockage sans traiter les sessions existantes.

`assistance.js` conserve les actions de renvoi de vérification et de demande de réinitialisation depuis l’écran de connexion, auparavant intégrées à `index.html`.
