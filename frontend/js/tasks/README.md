# Tâches et agenda

`tasks.js` conserve l’état partagé. Les scripts classiques sont chargés dans l’ordre de `frontend/index.html`, avec les constantes et outils dans `shared.js`.

| Module | Responsabilité |
| --- | --- |
| `shared.js` | Dates locales et libellés de contact. |
| `agenda-render.js` | Rendu des vues mois, semaine, année et jour. |
| `agenda.js` | Sélection et navigation entre les vues. |
| `calendar-data.js` | Contenu ICS et nom du fichier exporté, sans accès au DOM. |
| `calendar.js` | Téléchargement ICS et boutons associés. |
| `appointment-data.js` | Données préremplies pour la duplication à une semaine. |
| `appointments.js` | Confirmation, récurrences et préparation ou duplication des rendez-vous. |
| `list-data.js` | Filtrage des tâches et calcul des indicateurs. |
| `list.js` | Chargement et liste des actions. |
| `reminders.js` | Alertes du tableau de bord, notifications et rappels. |
| `form-data.js` | Lecture et remplissage des champs du formulaire. |
| `form.js` | Champs, saisie, édition, réalisation et suppression. |

Les fonctions globales, calculs, contrats API et confirmations restent identiques. Les relances du pipeline préremplissent le formulaire des tâches ; la création de devis reprend le contact. Le minuteur des rappels reste démarré par `loadTasks`, et le changement d’étape du formulaire reste écouté une seule fois dans `opportunities/form.js`.

`backend/test/sales-planning-ui.test.js` utilise une horloge, un DOM et une API simulés pour vérifier les vues, rappels, formulaires, annulations et liens entre domaines. Une vérification visuelle reste distincte.
