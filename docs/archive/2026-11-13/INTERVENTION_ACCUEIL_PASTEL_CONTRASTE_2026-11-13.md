# Accueil — pastel contrasté (direction A) — 13 novembre 2026

## Demande
L'utilisateur trouve l'accueil plat et choisit la direction A : garder le ciel pastel, mais avec du contraste et une hiérarchie nette.

## Modifications
- `src/components/home/HomeVirtualActions.jsx` : une action héroïque (Partie rapide / Reprendre la partie) pleine largeur, puis 3 tuiles (Défis, Contre l'IA, En ligne). Corrige le bug où « En ligne » tombait seul sur une 2ᵉ ligne (la règle 4 colonnes de HomeWorld.css était écrasée par HomeLobby.css). Mêmes identifiants d'action qu'avant.
- `src/components/GameSetup.jsx` : badge joueur dans l'en-tête (avatar, anneau d'XP, pastille de niveau) qui ouvre le Profil ; suppression de l'indication « Choisissez un mode… ».
- `src/styles/HomeLobby.css` : encre profonde `#2a2140`, accent corail `#ee6f5f`, titres en 700–800, plus aucun texte sous 11 px, sélecteur de mode segmenté, cartes opaques avec ombres colorées, bouton « Lancer la partie » prune avec reflet, onglet actif de la barre en encre pleine, ciel enrichi de halos.
- `src/styles/HomeWorld.css` : cartes de la scène saturées (couleurs du plateau), dos noir et or comme en partie, table plus marquée, nuages en volume. Anciennes règles `.lobby-actions--direct` supprimées.
- `prefers-reduced-motion` : reflets coupés.

## Vérification
- ESLint sur GameSetup et les composants home : réussi.
- Navigateur local en 375×812 et 320×700, modes Virtuel et Réel : pas de défilement horizontal, actions au-dessus de la barre de navigation.
- Backend local sans base (erreurs 500 sur le profil, sans rapport avec l'accueil). Lancement effectif des modes non retesté ; gestionnaires inchangés.

## Captures
- Avant : docs/screenshots/accueil-avant-pastel-contraste-2026-11-13.jpg
- Après : docs/screenshots/accueil-pastel-contraste-virtuel-2026-11-13.jpg, docs/screenshots/accueil-pastel-contraste-reel-2026-11-13.jpg

Aucun commit, push ni changement de version.

## Suite : finitions et vraie scène 3D

### Finitions
- Mini-logo (trois cartes en éventail), version discrète à la place du bouton « Mise à jour », entrée animée en cascade.
- `Dashboard.jsx` : au plus une annonce (Nouveautés, Carrière Maître, Mode Tourment) par session ; aucune pour un nouveau joueur qui vient de finir le guide. Parcours nouveau joueur non testé de bout en bout.

### Scène 3D (three.js + @react-three/fiber)
- `src/components/home/HomeWorldScene3D.jsx` : table flottante (feutre, cadre doré), 12 cartes distribuées depuis la pioche puis retournées, défausse, grande carte « 12 » qui flotte et se retourne au tap, cartes lointaines qui dérivent. Inclinaison selon le doigt / la souris et le gyroscope (Android ; iOS demande une permission, non gérée).
- `src/components/home/cardTextures.js` : faces, dos et feutre dessinés sur canvas, aucun fichier image.
- `HomeWorldScene.jsx` : chargement différé ; la scène CSS sert de repli pendant le chargement, sans WebGL ou en cas d'erreur 3D. `prefers-reduced-motion` : scène figée.
- Poids : module 3D séparé de 231 Ko gzip (cœur three.js), bundle principal inchangé.
- Piège rencontré : un arrondi supérieur à la demi-épaisseur déforme la boîte arrondie (le plateau engloutissait les cartes).

### Vérification
- ESLint et build OK. Rendu contrôlé en 375×812, modes Virtuel et Réel, sans erreur console.
- Non testé : performances et gyroscope sur téléphone réel (Samsung).
- Capture : docs/screenshots/accueil-scene-3d-2026-11-13.jpg

### Itération 2 de la scène 3D
- Reflets : carte d'environnement générée localement (RoomEnvironment de three.js, sans HDR téléchargé), cadre doré métallique, faces de cartes vernies (clearcoat).
- Cadrage : scène plus grande, qui passe derrière le titre (titre avec halo de lisibilité).
- Interaction : chaque carte de la grille se retourne au tap après la distribution ; une carte cachée révèle une valeur au hasard (-2 à 12), avec vibration courte. Indication « Touchez une carte » qui apparaît après la distribution et disparaît au premier tap.
- Ambiance : poussière dorée flottante, halo chaud derrière la grande carte.
- Build OK, module 3D 233 Ko gzip. Rendu final non revérifié en capture : le panneau navigateur était masqué (animations figées), puis utilisé par l'utilisateur.

## Table de jeu et dos de cartes
- Fond « Original » : ciel frais (pêche → aqua → menthe, rayons, nuages). Le tapis prune a été essayé puis retiré.
- Plateaux opaques en relief sur tous les fonds ; tour actif = anneau qui respire (menthe joueur, corail adversaire), pastille pleine « À vous de jouer » / « Son tour », autre main légèrement estompée.
- Bandeau central pendant le tour adverse : « L'IA réfléchit » + points animés (DrawDiscardTrigger.jsx).
- Barre du haut : ombre shadow-2xl remplacée (elle bavait sur le plateau adverse) ; classe `skyjo-game-header` ajoutée.
- Dos classique : retour au noir et or d'origine (le thème le délavait en lavande).
- Nouvelle famille de 12 dos SVG cohérente (public/card-backs/, générée par scripts/generate-card-backs.mjs) : mêmes identifiants, noms et niveaux de déblocage ; chemins mis à jour dans skinUtils, rewards, GameMenu, ImagePreloader ; ajoutés au précache PWA. Les anciennes images restent dans public/ (non supprimées).
- Tests 45/45, build OK.

### Itération : plus de dos noirs, plateaux en bac
- Famille de dos refaite en tons moyens du thème (lilas, crépuscule, jade, ardoise, améthyste…), aucun fond noir. Nouveau dos **classique** lilas en SVG (public/card-backs/classic.svg) qui remplace le PNG noir et or partout (skinUtils, GameMenu, ImagePreloader). Le PNG reste dans public/.
- Aura du joueur actif : la tranche colorée décalée et le contour animé (double trait) sont remplacés par un anneau net de 2,5 px et un halo qui respire sur un calque séparé.
- Plateaux en bac : rebord blanc, intérieur creusé lilas pâle, tranche discrète.
- Dos en jeu : liseré blanc au lieu de l'or. Pioche affichée en tas (liseré blanc, cartes empilées).
- Build OK ; vérifié en partie (tour du joueur).

### Cohérence globale (PWA mobile)
- Un seul ciel partout : accueil, menus et table (pêche → bleu ciel → sarcelle).
- Scène 3D de l'accueil : dos = skin choisi par le joueur (SVG chargé en texture, repli lilas), table en bac menthe à rebord blanc (plus d'or), scène recadrée sous le titre, cartes lointaines écartées du titre.
- Batterie : la scène 3D ne calcule plus d'images quand elle n'est pas à l'écran (IntersectionObserver → frameloop « never »), densité de pixels plafonnée à 1,5, qualité adaptative.
- Barre d'état mobile (theme-color, manifeste) : #f6cdbd, assortie au haut du ciel, au lieu du gris ardoise.
- Build OK.
