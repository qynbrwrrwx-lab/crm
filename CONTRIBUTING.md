# Contribuer à My Prospect

## Principes de travail

1. Travailler par domaine fonctionnel et éviter les réécritures globales non testées.
2. Préserver les routes API et le format des données existantes sauf migration explicite.
3. Isoler chaque requête métier avec `userId`.
4. Ne jamais versionner `.env`, clés SMTP, jetons, mots de passe ou données réelles.
5. Ne pas modifier directement une facture émise : utiliser le flux prévu (paiement, annulation ou avoir).

## Convention de code

- Nommer les fonctions selon leur intention (`createInvoice`, `sendPaymentReminder`) et non selon l'écran.
- Garder les routes HTTP minces ; extraire la logique réutilisable dans `services/`.
- Ajouter un commentaire uniquement lorsqu'il explique une décision métier, de sécurité ou une contrainte non évidente.
- Préférer les retours d'erreur explicites et cohérents pour les appels API.
- Toute insertion de donnée utilisateur dans le HTML doit utiliser la fonction d'échappement partagée.

## Avant une demande de fusion ou un déploiement

Exécuter les commandes du [guide de développement](docs/DEVELOPMENT.md), vérifier l'absence de secret dans le diff et tester le scénario fonctionnel concerné avec un compte qui ne possède pas les données manipulées.
