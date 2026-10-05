# Guide de développement

## Prérequis

- Node.js LTS
- Une base MongoDB disponible
- Un fichier `backend/.env`, créé à partir de `backend/.env.example`

## Démarrer localement

```powershell
cd C:\Users\JULIEN\crm-salesforce\backend
npm install
npm start
```

L'application est ensuite disponible sur l'URL affichée par le terminal, habituellement `http://localhost:3000`.

## Variables d'environnement

| Variable | Usage |
| --- | --- |
| `MONGO_URI` | Connexion MongoDB. |
| `JWT_SECRET` | Signature des sessions. Utiliser une valeur longue et propre à chaque environnement. |
| `BASE_URL` | Adresse publique servant aux liens e-mail. |
| `EMAIL_FROM` | Expéditeur visible des e-mails My Prospect. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Serveur SMTP. |
| `SMTP_USER`, `SMTP_PASSWORD` | Identifiants SMTP. Ne jamais les mettre dans le dépôt. |

## Vérifier une modification

Depuis la racine du projet :

```powershell
npm test --prefix backend
node --check backend/server.js
Get-ChildItem frontend/js -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
git diff --check
```

Pour une évolution métier, compléter ces contrôles par une recette locale avec deux comptes distincts afin de vérifier l'isolation des données.

## Déploiement

Le déploiement ne doit suivre que des vérifications réussies. Avant la mise en production, renseigner les variables dans l'hébergeur, contrôler `GET /api/health`, puis effectuer une recette minimale : connexion, création de données, PDF et e-mail de test.
