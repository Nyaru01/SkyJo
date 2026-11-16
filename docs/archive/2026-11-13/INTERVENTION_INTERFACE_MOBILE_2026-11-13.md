# Navigation, plateau, carrière et finitions mobiles

13 novembre 2026 — réalisation locale à la demande de l’utilisateur, après le prototype du menu Jouer. Version conservée : 3.3.24. Aucun commit, push ou déploiement.

## Changements

### Navigation

- `Navbar.jsx` : cinq destinations **Accueil, Social, Jouer, Stats, Profil**. Libellés de 11–12 px, cibles tactiles de 56 px de haut, sélection fixe sans glissement ni changement de taille. Indicateur de notification sociale conservé, sans rebond permanent. Navigation sémantique avec `aria-current`.
- `ProfileHub.jsx` : nouvel espace affichant le profil local, la progression et les liens vers **Mes parties** et **Réglages**.
- `Dashboard.jsx` : routes existantes conservées, boutons de retour vers Profil dans l’historique et les réglages ; Profil reste sélectionné pour ces sous-écrans. Marge basse adaptée à la barre fixe et à la safe area.
- Correction constatée pendant l’essai : une sauvegarde virtuelle ne masque plus la navigation lorsqu’on consulte le menu Jouer. Elle reste masquée pendant la partie.

### Plateau

- `PlayerHand.jsx` : unité « pts », nom accessible « Score visible » et indication textuelle **À vous / En jeu**, en complément du point et de la couleur. Le score reste la somme des cartes révélées, pas une estimation du score final.
- `Tabletop.css` : libellés Pioche/Défausse de 10 px et positionnés vers l’intérieur pendant le choix pour éviter leur découpe ; badges plus compacts horizontalement. Suppression du flou derrière les mains pour limiter les couches de rendu.
- `DrawDiscardTrigger.jsx` : classe de présentation identifiant le choix de carte, sans changer ses actions ni ses animations.
- `VirtualGame.jsx` : texte « Piochez ou prenez la défausse » à la place de « Piocher ou défausser » dans l’instruction concernée.
- Dimensions et espacement de la grille, indexation colonne d’abord, ancrages des cartes et séquences d’animation approuvées inchangés. Aucun changement de moteur ou d’heuristique IA.

### Carrière et fenêtres

- `ExperienceBar.jsx` : séparation du résumé et de **CareerPlan**, monté une seule fois dans Dashboard. Plusieurs résumés peuvent ainsi ouvrir la même fenêtre sans créer plusieurs portails. Le centrage de la récompense conserve son calcul avant peinture.
- Présentation harmonisée : panneau opaque, progression plus discrète, textes secondaires agrandis, récompenses verrouillées lisibles, boutons et fermeture d’au moins 48 px.
- `useDialogFocus.js` : focus initial, boucle Tab/Maj+Tab, Échap, retour au déclencheur et blocage du défilement avec compteur pour les fenêtres superposées.
- `ModalShell.jsx` : présentation opaque et sans animation de conteneur par défaut, y compris en plein écran ; possibilité historique de fenêtre animée conservée via `stableBackdrop={false}`. Le focus est géré dans les deux branches.
- Fenêtres quotidienne et annonce saisonnière de `GameMenu.jsx` transférées dans ce conteneur stable, avec titres associés et fermetures nommées. Le contenu long peut défiler sur petit écran.
- Catalogues de récompenses, XP, cycles Prestige et protections des aperçus administrateur inchangés. Cette intervention ne complète pas les catalogues Prestige suivants.

### Styles et skills

`MobilePolish.css`, importé après les styles globaux dans `main.jsx`, regroupe les styles de navigation, profil, carrière et fenêtres. Les changements de plateau restent dans Tabletop.css. Les préférences de réduction des animations sont respectées pour les nouveaux contrôles.

Skills appliqués : **UI UX Pro Max** (références jeux de cartes et règles mobiles), **Vercel React Best Practices** (composants séparés, abonnements ciblés, absence de nouvelle dépendance). Aucun skill exclusivement dédié au jeu mobile n’était disponible. Vérification UI avec le navigateur intégré.

## Vérifications effectuées

- **45 tests réussis**, aucun échec.
- Build Vite/PWA réussi après les modifications ; avertissements préexistants de Browserslist, textures noise/felt, imports mixtes et taille du bundle.
- `git diff --check` sans erreur.
- ESLint ciblé sans erreur sur Dashboard, Navbar, ProfileHub, ExperienceBar, ModalShell, useDialogFocus, GameMenu, PlayerHand et main.
- Les diagnostics ESLint historiques de VirtualGame (**16 erreurs, 6 avertissements**) et DrawDiscardTrigger (**4 erreurs**) ont été comparés à HEAD : mêmes diagnostics avant/après. Le lint global n’est donc pas présenté comme vert.

### Contrôle visuel et interactions

Le navigateur intégré bloquant précédemment sur le préchargement audio de l’application complète, le contrôle utilise un harnais temporaire montant **le vrai Dashboard et ses composants** avec les styles réels, sans l’introduction ni ImagePreloader. Le harnais a été supprimé et l’onglet fermé en fin d’essai.

- Navigation Profil → historique → Profil → réglages ; sélection Profil conservée. Menu Jouer accessible.
- Profil, menu et plateau inspectés aux largeurs mobiles 320, 375 et 430 px selon les écrans. À 320 px : document sans débordement horizontal ; cinq commandes de navigation mesurées à environ **53 × 56 CSS px**.
- Carrière : une seule fenêtre modale, focus placé sur Fermer, Maj+Tab bouclé vers Carrière, Échap ferme, focus et défilement restaurés. Vérification en portrait étroit et paysage **812 × 375** : fenêtre entièrement dans la hauteur disponible.
- Fenêtre quotidienne : nom associé à un titre existant, focus sur Fermer, fond opaque mesuré, aucune animation ni transformation du conteneur.
- Partie IA normale avec **TestMobile**, profil de contrôle dans le stockage local du navigateur intégré uniquement : lancement, révélation de deux cartes, pioche, placement par remplacement d’un 10, tour de l’IA, mise à jour du score visible (16 → 14), confirmation de sortie annulée, rechargement puis reprise avec scores conservés.
- Le test n’a terminé aucune manche ni attribué de récompense. Aucune validation multijoueur ou cloud et aucun test de production.

Captures de contrôle :

- `screenshots/profil-navigation-2026-11-13.jpg`
- `screenshots/plateau-mobile-2026-11-13.jpg`
- `screenshots/carriere-mobile-2026-11-13.jpg`

## Validation utilisateur attendue

Serveur frontend disponible sur **http://127.0.0.1:5173/**. Backend arrêté pour éviter les migrations sur la base distante signalées dans la reprise.

Dans le navigateur habituel, vérifier les cinq destinations, Profil → Mes parties / Réglages, le plan de carrière, les défis et une partie IA. La validation complète du chargement des médias, du tactile sur appareil réel et des fonctions réseau reste à faire. Aucun relevé FPS ni audit exhaustif de tous les contrastes n’a été réalisé.

Publication uniquement après retour utilisateur et instruction d’envoi. Les fichiers utilisateur existants et le fichier d’environnement parent ont été conservés ; aucun secret n’a été recopié. Les fichiers temporaires de contrôle ont été retirés.
