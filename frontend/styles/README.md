# Styles partagés

`../style.css` reste le point d’entrée chargé par l’application et importe ces feuilles dans l’ordre ci-dessous. Cet ordre est une partie du contrat visuel : les règles plus spécialisées complètent les règles précédentes.

| Fichier | Contenu |
| --- | --- |
| `base.css` | Fondations visuelles, mise en page, composants communs et retours utilisateur. |
| `orders.css` | Onglets et éléments de commande historiques. |
| `auth.css` | Connexion, création de compte et contenu d’accueil. |
| `business.css` | Écrans métier généraux, entreprise, clients, produits et réassort. |
| `commerce.css` | Listes, devis, documents commerciaux, paiements et tableau de bord. |
| `app-shell.css` | Cadre applicatif, système de composants et adaptations responsive finales. |
| `admin-login.css` | Connexion administrateur autonome. |

Ajouter une règle dans le module le plus proche de son écran. Si une règle doit remplacer une règle existante, conserver l’ordre d’import afin de préserver la cascade CSS.
