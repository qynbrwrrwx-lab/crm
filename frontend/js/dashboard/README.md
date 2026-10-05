# Tableau de bord

Les scripts classiques sont chargés après `dashboard.js` et avant `app.js`, dans l’ordre de `frontend/index.html`. Le fichier principal conserve `revenueChart` et `dashboardPaidInvoices`. Les instances `chart` et `analyticsChart` restent déclarées dans `app.js`.

| Module | Responsabilité |
| --- | --- |
| `indicators.js` | Indicateurs contacts, documents commerciaux et stock ; coordination des mises à jour. |
| `expenses.js` | Dépenses, alertes fournisseurs et prévision de trésorerie à 30 jours. |
| `alerts.js` | Relances clients et préparation de la facturation électronique. |
| `activity.js` | Activité récente, recettes mensuelles et produits les plus vendus. |
| `charts.js` | Graphiques des contacts, encaissements et favoris. |
| `onboarding.js` | Progression et navigation du guide de démarrage. |

Ce découpage conserve les fonctions, calculs, routes API et points d’entrée HTML existants. Aucune requête ne part au chargement de ces scripts. Les autres domaines continuent d’appeler les fonctions globales de mise à jour.

Les tests `backend/test/dashboard-ui.test.js` utilisent un DOM, une horloge et des graphiques simulés. Ils couvrent les indicateurs de stock, la trésorerie avec paiements partiels, les alertes, le classement et l’échappement de l’activité, les graphiques et le guide de démarrage. Une vérification visuelle dans le navigateur reste distincte.
