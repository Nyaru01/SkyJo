# Défi quotidien et simplification du duel

13 novembre 2026 — modifications locales demandées à partir de la capture du défi quotidien. Aucun push, commit ou changement de version.

## Changements

- Nouveau `DailyChallengeDialog.jsx` et `DailyChallenge.css` : fenêtre opaque, titre aligné à gauche, mascotte et bonus réunis dans une scène, choix de difficulté par radios natives, condition de victoire lisible et bouton de lancement résumant le choix.
- Remplacement dans cette fenêtre de l’ancien robot quotidien par la mascotte sphérique utilisée dans le duel. Son rendu lissé, ses expressions animées et ses variantes ambre/corail suivent la difficulté choisie. Les sprites existants sont réutilisés, sans génération de nouvelle illustration.
- Difficile affiche **+3 XP**, Tourment **+6 XP**. Aucun choix automatique ; le lancement reste désactivé tant qu’aucune difficulté n’est choisie. Les valeurs et les gestionnaires de démarrage de GameMenu restent ceux de l’application existante.
- `GameMenu.jsx` : délégation de la présentation quotidienne au composant dédié, suppression de l’ancien bloc de présentation et de ses imports inutilisés.
- `AISetupScreen.jsx` : suppression de la consigne « Touchez le robot », du badge décoratif « IA » et du compteur 01/01. Les intitulés fonctionnels comme « Jouer contre l’IA » sont conservés.
- `AISetup.css` : mascotte du duel portée à **200 × 200 px**, scène et cercles adaptés, styles des annotations supprimés.
- `virtual/RobotAvatar.jsx` : suppression de l’infobulle « Toucher pour animer le robot ». Interaction au toucher, décodage avant remplacement de la feuille et réduction des animations conservés.
- Ancien composant `ui/RobotAvatar.jsx` conservé comme ressource ; il n’est plus utilisé par cette fenêtre.

Skills appliqués : UI UX Pro Max pour la composition mobile, les choix tactiles et la lisibilité ; Vercel React Best Practices pour l’extraction du composant et la réutilisation de la mascotte.

## Vérifications

- **45 tests réussis**, aucun échec.
- Build Vite/PWA réussi, avertissements historiques habituels.
- ESLint ciblé sans erreur sur GameMenu, DailyChallengeDialog, AISetupScreen et virtual/RobotAvatar.
- `git diff --check` sans erreur.
- Contrôle visuel dans le vrai Dashboard via un harnais temporaire, sans le préchargement multimédia. Le harnais a été supprimé après usage.
- À **390 × 844** : vérification de l’état initial sans sélection, Difficile puis Tourment ; récompense et bouton se mettent à jour avec le bon choix. La flèche droite du clavier permet de passer de Difficile à Tourment.
- À **320 × 740** : fenêtre de 296 px de large, entièrement dans la hauteur de l’écran, aucun débordement horizontal. Échap ferme la fenêtre.
- Dans le duel : absence du badge et de la consigne confirmée dans le DOM ; robot mesuré à 200 px, aucun débordement à 320 px. Inspection également à 390 px.
- Aucun défi terminé ni récompense attribuée pendant cette intervention. Le moteur, l’IA, les sauvegardes, les délais et la logique d’XP n’ont pas été modifiés.

Captures : `screenshots/defi-quotidien-refonte-2026-11-13.jpg` et `screenshots/duel-sans-annotations-2026-11-13.jpg`.

## Essai utilisateur

Frontend disponible sur **http://127.0.0.1:5173/** → Jouer → Défi quotidien ou Jouer contre l’IA. Backend arrêté. Le chargement complet des médias et l’essai sur téléphone réel restent à valider dans le navigateur habituel. Aucun envoi avant validation utilisateur.
