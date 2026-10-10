# Opportunités commerciales

`opportunities.js` conserve l’état partagé. Les scripts classiques sont chargés dans l’ordre de `frontend/index.html`, avec les constantes et outils dans `shared.js`.

| Module | Responsabilité |
| --- | --- |
| `shared.js` | Étapes, probabilités, motifs de perte et formatage. |
| `board.js` | Chargement et glisser-déposer du pipeline. |
| `board-render.js` | Métriques, préparation des cartes et rendu des colonnes. |
| `board-enhancements.js` | Relances et indicateurs de perte ou d’inactivité des cartes. |
| `insights.js` | Conversion, origines, pertes et détails du tableau de bord. |
| `form.js` | Champs, édition, sauvegarde et suggestion de probabilité. |
| `actions.js` | Relances, changements d’étape, création de devis et suppression. |
| `csv.js` | Export du pipeline. |

Les fonctions globales, calculs, contrats API et confirmations restent identiques. Les relances du pipeline préremplissent le formulaire des tâches ; la création de devis reprend le contact. Le minuteur des rappels reste démarré par `loadTasks`, et le changement d’étape du formulaire reste écouté une seule fois dans `opportunities/form.js`.

`backend/test/sales-planning-ui.test.js` utilise une horloge, un DOM et une API simulés pour vérifier les vues, rappels, formulaires, annulations et liens entre domaines. Une vérification visuelle reste distincte.
