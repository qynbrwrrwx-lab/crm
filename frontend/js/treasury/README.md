# Trésorerie

`treasury.js` conserve les paramètres, les mouvements, l’identifiant édité et l’instance du graphique. Les scripts classiques sont chargés dans l’ordre de `frontend/index.html`.

| Module | Responsabilité |
| --- | --- |
| `shared.js` | Formatage des montants et dates. |
| `csv.js` | Export, lecture et import des relevés avec confirmation. |
| `list.js` | Chargement, solde, filtres et coordination de l’affichage. |
| `reconciliation.js` | Suggestions de rapprochement, navigation et validation. |
| `chart.js` | Graphique des entrées et sorties sur six mois. |
| `forecast.js` | Prévisions à 30 jours et alerte de réserve minimale. |
| `form-data.js` | Lecture, remplissage et réinitialisation des champs de formulaire. |
| `form.js` | Paramètres, saisie, édition, suppression et initialisation de la date. |

Le découpage conserve les calculs, les fonctions globales, les contrats API et les confirmations existants. Les factures et dépenses sont lues dans leurs états partagés. Seul `form.js` attache l’écouteur DOMContentLoaded de ce domaine.

`backend/test/treasury-ui.test.js` vérifie les soldes, filtres, prévisions avec paiements partiels, alertes, rapprochements, formulaires, imports et graphiques avec une horloge, un DOM et une API simulés. Une vérification visuelle du navigateur reste distincte.
