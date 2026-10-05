# Chargement des scripts

L’interface utilise des scripts classiques qui partagent le même espace global. Leur ordre dans `../index.html` est donc intentionnel et fait partie du fonctionnement de l’application.

1. Les utilitaires `core/` sont chargés en premier.
2. L’interface partagée `ui/` est chargée avant les domaines métier.
3. Chaque domaine charge son fichier racine (`contacts.js`, `invoices.js`, etc.) avant les fichiers de son dossier. Le fichier racine porte l’état partagé du domaine.
4. Les scripts `app/` et `auth/` terminent l’initialisation après que les fonctions dont ils dépendent sont disponibles.
5. Les pages autonomes chargent seulement leur script dans `pages/`; elles ne dépendent pas de la page principale.

Le test `backend/test/html-core-ui.test.js` vérifie que chaque module principal est présent une seule fois et qu’il est chargé après le fichier racine de son domaine. Lorsqu’un nouveau module est ajouté, l’ajouter explicitement dans `index.html` dans la section de son domaine.
