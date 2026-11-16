# Refonte de l’écran Contre l’IA et de la présentation de sa mascotte

13 novembre 2026 — demande fondée sur la capture fournie par l’utilisateur. Réalisation locale uniquement, version 3.3.24 conservée.

## Direction et réalisation

L’ancien écran présentait quatre grands blocs de difficulté et un petit robot isolé en bas. Le nouvel écran place l’adversaire au centre d’une scène, avec une sélection plus compacte et un lancement rappelant explicitement le mode choisi.

- **AISetupScreen.jsx**, nouveau composant de présentation : en-tête « Rencontrez votre rival », scène du robot, socle et cercles lumineux discrets, réplique liée au mode, choix Normal/Difficile/Hardcore/Tourment, explication contextuelle et bouton de lancement.
- **AISetup.css** : panneaux opaques bleu nuit, accents menthe/ambre/violet/corail, hiérarchie plus lisible, état sélectionné avec coche, commandes tactiles et focus visible. Les radios natives permettent la navigation aux flèches. Les boutons de règles sont séparés de la sélection, sans contrôles imbriqués.
- **virtual/RobotAvatar.jsx** : présentation héro de 184 px dans cet écran, rendu lissé au lieu de pixelated, animation ponctuelle au changement de difficulté ou au toucher, annulation des requêtes obsolètes, respect de prefers-reduced-motion. La feuille précédente est conservée jusqu’au décodage de la nouvelle pour éviter un trou visuel lors du chargement.
- Les quatre feuilles de sprites existantes sont réutilisées ; aucune nouvelle illustration bitmap n’a été générée. La transformation de la mascotte porte sur sa taille, son rendu, sa mise en scène et ses interactions. Le robot du défi quotidien n’est pas modifié.
- **VirtualGame.jsx** : l’ancien bloc de présentation est remplacé par le composant dédié. Les gestionnaires existants de lancement, pseudo, règles et paramètres des parties sont conservés.
- **Dashboard.jsx / VirtualGame.jsx** : remontée de l’écran réellement affiché avant peinture pour garder la navigation basse pendant la préparation, même si une sauvegarde existe, et la retirer pendant le plateau.

Skills utilisés : **UI UX Pro Max**, références Card & Board Game et sélection tactile ; **Vercel React Best Practices**, séparation du composant de présentation et conservation des gestionnaires métier. Aucune nouvelle dépendance, aucune modification du moteur, des récompenses ou des animations de cartes.

## Contrôles

- **45 tests réussis**, aucun échec.
- Build Vite/PWA réussi ; avertissements déjà connus (Browserslist, textures noise/felt, imports mixtes et bundle volumineux).
- ESLint ciblé : AISetupScreen, RobotAvatar et Dashboard sans erreur. VirtualGame conserve les mêmes nombres et types de diagnostics qu’à HEAD : 16 erreurs et 6 avertissements historiques ; le lint global n’est pas présenté comme vert.
- `git diff --check` sans erreur.
- Contrôle dans un harnais temporaire montant le vrai Dashboard et les styles, sans le préchargement multimédia qui bloquait le navigateur intégré. Harnais supprimé après usage.
- À **320 px** : largeur du document égale au viewport, cartes de sélection mesurées à environ **139 × 88 px**. Inspection également à **390 × 844** avec la navigation basse.
- Flèche droite depuis Normal : sélection Difficile et mise à jour de la réplique et du bouton. Sélections Hardcore et Tourment contrôlées.
- Règles Tourment : guide Tourment en neuf étapes. Règles Hardcore : guide du nettoyage de colonne en une étape.
- Toucher de la mascotte effectué ; changement de sa feuille et de sa couleur constaté entre les modes. La préférence reduced-motion est prise en charge dans le code, sans émulation système lors du contrôle.
- Lancement Normal avec le profil local de contrôle TestMobile : arrivée à la révélation initiale, deux mains présentes, navigation masquée sur le plateau. Aucun résultat de manche ni récompense attribuée.

Captures : `screenshots/duel-ia-normal-2026-11-13.jpg` et `screenshots/duel-ia-tourment-2026-11-13.jpg`.

## Essai et publication

Frontend local : **http://127.0.0.1:5173/** → Jouer → Jouer contre l’IA. Faire varier les quatre modes, toucher la mascotte, consulter les règles puis lancer une partie.

Backend toujours arrêté. Le chargement multimédia de l’application complète et l’essai tactile sur un appareil réel restent à valider dans le navigateur habituel. Aucun changement de production, commit ou push. Validation utilisateur requise avant un envoi.
