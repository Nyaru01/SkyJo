# Bouton du duel visible et accueil animé rétabli

Suite du travail : publication autorisée par l’utilisateur, intégrée à la version 3.3.26. Les mentions « local » ci-dessous décrivent les vérifications précédant cet accord. L’essai d’accueil rejeté reste uniquement dans les archives locales ; les sources animées publiées sont conservées.

13 novembre 2026 — correction demandée après retour depuis un Samsung S25 Ultra : bouton « Affronter l’IA » sous la navigation, et rejet de la nouvelle présentation d’accueil qui supprimait les animations appréciées.

## Corrections

- **Accueil** : restauration exacte des sources publiées de GameSetup, SkyjoVirtuelButton et du conteneur d’accueil dans Dashboard. Les en-têtes SVG animés, les cartes, les effets et les boutons précédents sont rétablis. La feuille HomeSetup.css de l’essai rejeté a été supprimée. Le compte rendu et la capture de cet essai sont conservés comme historique identifié.
- **AISetupScreen.jsx** : le lancement est placé dans une zone fixée juste au-dessus de la navigation. Sa hauteur est mesurée à l’ouverture et suivie avec ResizeObserver ; le bouton ne dépend donc plus de sa position à la fin du contenu.
- **AISetup.css** : espace réservé pour ne pas rendre les derniers contenus inaccessibles, fond de séparation du lancement et composition plus compacte sous 850 px de hauteur. La scène et le robot s’adaptent à la hauteur, sans supprimer l’animation de la mascotte. La navigation et les fenêtres restent au-dessus/en dessous selon leur rôle.

Aucun changement aux difficultés, règles, gestionnaires de lancement ou animations de cartes. Aucun nouveau push ou changement de version ; base publiée 3.3.25 conservée.

## Vérifications

- 45 tests réussis ; lint ciblé d’AISetupScreen et `git diff --check` sans erreur.
- Build Vite/PWA réussi, avec les avertissements historiques habituels.
- Test du vrai Dashboard via un harnais temporaire sans introduction/préchargement multimédia ; harnais supprimé après usage.
- Mode **Tourment**, le plus haut en contenu : bouton entièrement visible au-dessus de la navigation dans les trois viewports contrôlés, sans défilement initial à 412 × 820.
  - 412 × 820 : bouton y=652–720, navigation y=728.
  - 390 × 844 : bouton y=676–744, navigation y=752.
  - 360 × 740 : bouton y=572–640, navigation y=648.
- Clic réel sur le bouton de lancement : arrivée à la révélation initiale du plateau Tourment. Aucune manche terminée ni récompense attribuée.
- Accueil restauré inspecté ; présence des animations SVG des deux visuels également confirmée dans les fichiers sources.
- Ces mesures simulent des tailles de navigateur mobile ; elles ne constituent pas un essai sur le Samsung physique de l’utilisateur. Le chargement multimédia complet et le rendu sur ce téléphone restent à valider dans le navigateur habituel.

Captures : `screenshots/duel-bouton-visible-2026-11-13.jpg` et `screenshots/accueil-anime-restaure-2026-11-13.jpg`.

Frontend disponible sur **http://127.0.0.1:5173/**. Backend arrêté. Travail local uniquement, en attente de validation utilisateur.
