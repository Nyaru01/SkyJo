# Brief Codex — Le décor du robot rival (écran « Face à l'IA »)

> Rédigé par Claude pour Codex. Mission courte et ciblée : rendre le **conteneur du robot** de l'écran
> « Face à l'IA » beaucoup plus beau et vivant, **sans le faire ramer** sur mobile et **hors ligne**.

## 1. Contexte

Écran : `src/components/virtual/AISetupScreen.jsx` (onglet Jouer → Face à l'IA). En haut, une boîte
arrondie montre le robot rival devant un décor propre au mode choisi. Depuis la dernière version, il
n'existe plus que **deux modes** : **Tourment** (cartes spéciales, ton corail/rose, « jouer avec le feu »
version malicieuse) et **Fury** (cartes de sabotage, ton braise/rouge-orangé, destruction).

Il y a désormais **beaucoup de place libre** sous les deux boutons de mode (avant il y en avait 4) : le
conteneur peut **grandir** (ex. 166 px → 240–280 px de scène sur un écran de 375×812), tant que le bouton
« Affronter l'IA » reste visible sans scroll sur un 375×667.

## 2. Ce qui existe (à lire d'abord)

- Structure : `.ai-rival` > `.ai-rival-stage.ai-rival-stage--<mode>` contenant
  `.ai-rival-grid`, `.ai-rival-orbit`, `.ai-rival-platform` (vestiges masqués), `<IslandSpin />`,
  `.ai-rival-sea`, puis `<RobotAvatar size="hero" rival />`.
- CSS : `src/styles/AISetup.css` (base, hauteur de scène l. 15 et l. 57 en mobile) et surtout
  `src/styles/MenuLobby.css` lignes ~457–1700 (thème réel : ciels par mode, mer de nuages
  `.ai-rival-sea`, île, braises de Fury). Les règles `--hard` / `--hardcore` sont désormais **mortes** :
  les supprimer.
- `src/components/virtual/IslandSpin.jsx` : petite île flottante qui tourne (sprite WebP 120 images,
  `public/rival/island-spin.webp`, 345 Ko, fondu entre images).
- `src/components/virtual/RobotAvatar.jsx` : le robot (image par mode, flotte doucement). Il **n'a pas de
  jambes** : il lévite (petite flamme de réacteur), il ne marche pas et **ne danse pas**.

## 3. Ce qui ne va pas (retours de Nyaru)

- Le décor fait « plat » : un dégradé + une silhouette de montagnes ; la boîte paraît posée sur l'interface.
- Le robot flotte au milieu du vide, sans rapport avec le sol ni avec l'île.
- Historique : plusieurs tentatives en **three.js temps réel** ont été refusées (rame, rendu « années
  2000 »), une grille qui clignotait aussi. **Ne pas repartir sur une scène 3D temps réel.**

## 4. Ce qu'on attend

Une vraie **petite scène illustrée en parallaxe**, une par mode, dans la DA Vesper (crépuscule, matières
douces, lumière chaude en contre-jour) :

- **3 à 4 plans** superposés (ciel → horizon lointain → nuages/mer de nuages → avant-plan), chacun en
  **image WebP légère ou SVG**, animés uniquement en `transform`/`opacity` (dérive lente, 20–60 s par
  cycle), pour une profondeur réelle.
- **Tourment** : ciel rose-corail et prune, nuages cotonneux, quelques cartes spéciales ou étincelles qui
  flottent au loin (discret), ambiance « magie malicieuse ».
- **Fury** : ciel braise sous un orage sec, horizon volcanique, quelques braises qui montent — **avec
  retenue** (Nyaru a déjà trouvé qu'il y avait « beaucoup trop de flammes »).
- **Le robot** : ancré à la scène (ombre portée douce et halo lumineux sous lui, cohérent avec la lumière
  du ciel). Il peut se déplacer un peu dans la boîte (dérive latérale lente, légère inclinaison dans le
  sens du mouvement, réacteur qui pulse), sans danser.
- **L'île** : garder `IslandSpin` au loin (petite, derrière la mer de nuages), placée différemment selon
  le mode, ou la remplacer si un meilleur élément de décor s'intègre mieux.
- **Cadre** : la boîte doit sembler **incrustée** dans l'écran (bordure fine lumineuse aux couleurs du
  mode, légère ombre intérieure, reflet en haut), pas posée par-dessus.
- **Transition** entre Tourment et Fury : fondu enchaîné des décors (~400 ms) quand on change de mode.
- Pas de nom ni de texte dans la boîte (retirés à la demande de Nyaru).

## 5. Contraintes

- **Performance** : 60 fps visés sur un Android moyen. Pas de WebGL, pas de `filter: blur()` animé, pas de
  `box-shadow` animé, pas de `feTurbulence`. Au plus ~8 éléments animés. `will-change: transform` seulement
  sur les plans qui bougent.
- **Poids** : total des nouveaux visuels ≤ 400 Ko (WebP), placés dans `public/rival/`, et **ajoutés au
  pré-cache hors ligne** (`includeAssets` dans `vite.config.js` contient déjà `rival/*.webp`).
- `prefers-reduced-motion` : décor figé, robot immobile.
- Ne toucher qu'à `AISetupScreen.jsx`, `IslandSpin.jsx`, `RobotAvatar.jsx` (si besoin, sans casser ses
  autres usages : défi quotidien, île de l'accueil) et aux CSS `AISetup.css` / `MenuLobby.css`.
  **Pas** de modification de la logique de jeu, de l'IA ou du serveur.
- Visuels **100 % originaux** (pas d'éléments repris d'un jeu ou d'un film existant).

## 6. Méthode

1. `git pull` sur `master` (le projet bouge depuis d'autres postes), branche `codex/rival-stage`.
2. **Jamais de push direct sur `master`** (déploiement production automatique) : ouvrir une PR.
3. Joindre à la PR : captures 375×812 des deux modes + une courte vidéo/GIF de l'animation, et le poids
   des nouveaux fichiers.
4. `npm test`, `npm run lint` (pas de nouvelle erreur sur les fichiers touchés), `npm run build` OK.
5. Vérifier hors ligne (build + `npm run preview`, onglet réseau coupé) que le décor s'affiche.

## 7. Critères d'acceptation

- [ ] Scène en parallaxe distincte pour Tourment et Fury, cohérente avec la DA Vesper.
- [ ] Robot ancré dans la scène, vivant mais sans danser ni « marcher ».
- [ ] Boîte incrustée dans l'interface, plus haute, bouton « Affronter l'IA » visible sans scroll sur 375×667.
- [ ] Fluide sur mobile, fonctionne hors ligne, respecte `prefers-reduced-motion`.
- [ ] Règles CSS `--hard`/`--hardcore` mortes supprimées.
- [ ] PR vers `master` avec captures ; tests, lint, build OK.
