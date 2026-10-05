# Profil entreprise

`company.js` conserve l’état du logo utilisé lors de l’enregistrement. Les cinq modules suivants sont chargés dans `frontend/index.html` à la place de l’ancien bloc unique.

| Module | Responsabilité |
| --- | --- |
| `profile.js` | Chargement du profil et contrôle des informations de démarrage. |
| `form.js` | Activation de l’édition et enregistrement du profil. |
| `email.js` | Aperçu du nom d’expéditeur et de l’adresse de réponse, avec ses écouteurs. |
| `electronic.js` | Aperçu de préparation, statut des documents et écouteurs de facturation électronique. |
| `logo.js` | Lecture du logo sélectionné et mise à jour de l’en-tête. |

Les fonctions globales et les contrats API sont conservés. Les 18 écouteurs restent attachés une seule fois aux mêmes champs et événements. L’aperçu électronique est calculé après le chargement de tous les champs d’identité, y compris l’adresse.

Les paramètres de texte des e-mails restent enregistrés avec le profil. L’envoi des documents reste dans `invoices/delivery.js` ; aucun e-mail n’est envoyé par ce découpage.

`backend/test/company-ui.test.js` vérifie le chargement, les aperçus, le payload PUT, les erreurs, les contrôles d’édition et le logo dans un DOM simulé. Une vérification visuelle du navigateur reste distincte.
