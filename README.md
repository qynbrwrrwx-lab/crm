# My Prospect

Application de gestion commerciale : contacts, produits, stock, devis, commandes, factures, avoirs et paiements.

## Lancer le projet

1. Copier `backend/.env.example` vers `backend/.env` et renseigner les valeurs reelles (ne jamais versionner ce fichier).
2. Depuis `backend`, installer les dependances avec `npm install`.
3. Lancer `npm start` (ou la commande de developpement deja utilisee par le projet).
4. Ouvrir l'URL affichee par le serveur.

## Verifier avant une mise en production

Depuis `backend` :

```powershell
npm test
Get-ChildItem ..\frontend\js -Filter *.js | ForEach-Object { node --check $_.FullName }
node --check server.js
```

L'endpoint de supervision est `GET /api/health`. Il renvoie `200` lorsque MongoDB est connecte, sinon `503`.

## Variables d'environnement

- `MONGO_URI` : chaine de connexion MongoDB.
- `JWT_SECRET` : secret long et aleatoire, propre a l'environnement.
- `SENDGRID_API_KEY` et `EMAIL_FROM` : requis pour l'envoi reel de documents par e-mail.
- `BASE_URL` : URL publique de l'application.

## Mise en production : actions hors code

Ces actions necessitent les acces de l'administrateur et ne sont pas executables depuis le depot :

1. Dans SendGrid, verifier le domaine ou l'expediteur `EMAIL_FROM`, la cle API et l'etat du compte avant de tester un envoi reel.
2. Dans l'hebergeur, renseigner les variables d'environnement, definir `/api/health` comme controle de sante et consulter les journaux en cas d'erreur.
3. Dans MongoDB Atlas, activer les sauvegardes automatiques et tester une restauration sur une base de test avant l'ouverture au public.
4. Faire valider les CGU/CGV, la politique de confidentialite, les mentions legales et la duree de conservation des donnees par un professionnel competent.
5. Tester manuellement un parcours complet avec deux comptes distincts : inscription, societe, devis, commande, facture, paiement, avoir, export et suppression de compte.

## Securite et donnees

Les donnees metier sont isolees par compte. Les utilisateurs disposent d'un export de leurs donnees, d'un changement de mot de passe et d'une suppression de compte avec confirmation. Les documents emis conservent un instantane de leurs lignes tarifaires.

## Recette manuelle avant ouverture au public

Utiliser deux navigateurs distincts, avec un compte A et un compte B. Chaque ligne doit etre validee avant publication.

| Test | Resultat attendu |
| --- | --- |
| Inscription et connexion | Le compte A peut se connecter et ne voit aucune donnee du compte B. |
| Fiche societe | Sans societe complete, la creation d'un devis est refusee avec un message clair. |
| Contact et produit | Le compte A peut creer, modifier puis rechercher ses donnees. |
| Stock | Une commande ne peut pas faire passer le stock sous zero ; un ajustement manuel est historise. |
| Devis | Un devis conserve les prix, TVA et libelles au moment de sa creation. |
| Cycle commercial | Devis accepte, commande puis facture : chaque conversion est possible une seule fois. |
| Paiement | Le moyen et la date de paiement sont enregistres et le statut devient paye. |
| Avoir | Une facture peut generer un seul avoir, rattache a la facture d'origine. |
| PDF | Verifier logo, coordonnees, client, lignes, TVA, totaux, IBAN/BIC et mentions. |
| E-mail | Apres validation SendGrid, un devis, une facture et un avoir arrivent a une adresse de test. |
| Export | Le compte A telecharge uniquement ses propres donnees. |
| Protection inter-comptes | Avec le compte B, toute URL ou identifiant du compte A est refuse. |
| Mot de passe | Le changement exige le mot de passe actuel et invalide le scenario de connexion avec l'ancien. |
| Suppression | Sur un compte de test uniquement, la suppression exige le mot de passe et efface les donnees associees. |
| Mobile | Rejouer les ecrans connexion, tableau de bord, devis et paiement en largeur mobile. |
