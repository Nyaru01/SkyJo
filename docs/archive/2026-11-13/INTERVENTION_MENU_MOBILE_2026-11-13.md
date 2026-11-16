# Prototype local du menu Jouer

13 novembre 2026 — lot 1 du plan graphique mobile, à valider par l’utilisateur avant tout envoi.

## Réalisation

- `src/components/GameMenu.jsx` : en-tête plus compact sans position fixe ; une action principale menthe, « Reprendre » si une partie existe, sinon « Jouer contre l’IA ». Modes secondaires sobres, défis regroupés, progression et accès au plan de carrière après les modes. Règles, fond de table et personnalisation conservés.
- `src/styles/GameMenu.css` : styles limités au menu, panneaux bleu nuit, hiérarchie typographique, retours d’appui sans déplacement, petits écrans et réduction des animations.
- `src/components/ui/SeasonalChallengeButton.jsx` : option `calm` utilisée seulement dans ce menu, sans modifier les conditions, récompenses ou fenêtres saisonnières.
- `src/components/ui/PremiumTiltButton.jsx` : option `calm` désactivant reflet périodique et variations d’échelle ; transmission de l’attribut HTML `disabled` pour les boutons indisponibles. Les autres appels conservent leurs effets par défaut.

Skills appliqués : UI UX Pro Max (références Card & Board Game et interaction mobile), Vercel React Best Practices (composants et abonnements existants préservés). Le catalogue ne possède pas de skill exclusivement consacré au jeu mobile.

Aucun changement au plateau, au moteur, aux sauvegardes, à l’IA, à la navigation basse ou aux calculs de carrière. Aucun changement de version, commit, push ou déploiement.

## Vérifications

- `npm test` : **45 tests réussis**, aucun échec.
- Build Vite/PWA réussi ; avertissements existants : Browserslist, textures noise/felt, imports mixtes et taille du bundle. Dernier build relancé après restauration de l’import RobotAvatar utilisé par la fenêtre quotidienne.
- ESLint ciblé sur les trois composants et `git diff --check` sans erreur.
- Contrôle visuel isolé du vrai composant GameMenu à **320, 375 et 430 px** ; à 320 px, largeur du document et du menu mesurée à 320 px. Le test utilise les styles réels mais ne reproduit pas l’en-tête et la barre basse de Dashboard.
- Ouverture/fermeture des fenêtres quotidienne et Récolte vérifiée. L’inspection a détecté l’import RobotAvatar manquant après nettoyage des imports ; restauré, puis ouverture quotidienne revérifiée avec succès.
- Bouton principal : destination `ai-setup` confirmée dans le harnais de contrôle. Pas de partie complète jouée et pas de lancement du défi lors de ce contrôle.
- Capture du composant : `docs/screenshots/menu-jouer-2026-11-13.jpg`.

Le harnais temporaire de vérification a été supprimé et l’onglet de test fermé. Le fichier de reprise non suivi présent au début a été conservé.

## Essai utilisateur

Frontend Vite actif sur **http://127.0.0.1:5173/**. Ouvrir dans le navigateur habituel puis choisir **Jouer**. Vérifier la nouvelle présentation, ouvrir une partie IA, revenir au menu et vérifier l’action Reprendre, les défis et le plan de carrière.

Limites : le navigateur intégré est resté à 79 % sur le préchargement des médias de l’application complète. Ce chargement n’a pas été modifié et le menu a été vérifié séparément. Si le navigateur habituel présente aussi ce blocage, diagnostiquer le chargement avant de considérer le fonctionnement validé.

Backend volontairement arrêté conformément à la reprise : son démarrage peut exécuter des migrations sur une base distante. Les fonctions en ligne et la synchronisation ne sont pas validées par cet essai frontend. Le fonctionnement complet et le rendu intégré à Dashboard restent à valider par l’utilisateur.
