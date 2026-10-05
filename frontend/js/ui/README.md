# Interface partagée

`ui.js` est le point d'entrée du domaine. Les scripts classiques suivants sont chargés avant les autres domaines dans `frontend/index.html`.

| Module | Responsabilité |
| --- | --- |
| `feedback.js` | Notifications et indicateur de chargement. |
| `application.js` | Affichage de l'application et chargements initiaux. |
| `navigation.js` | Navigation latérale, contexte de travail et mémorisation. |
| `shortcuts.js` | Date, menu réduit et fermeture des fenêtres par Échap. |
| `favorites.js` | Favoris et statistique de compte. |

Les chargements et fonctions globales existants sont conservés. La liste des favoris échappe les données de contact avant l'insertion HTML.
