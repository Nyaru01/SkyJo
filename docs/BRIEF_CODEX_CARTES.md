# Brief Codex — Refonte visuelle des cartes de Vesper

> Rédigé par Claude pour Codex. À faire **après** la PR des avatars (`docs/BRIEF_CODEX_AVATARS.md`), dans la
> même direction artistique. On **garde des chiffres/nombres** sur les cartes, mais on change toute la DA.
> Ce brief ne touche **que l'apparence** : règles, composition du paquet et scores ne changent pas.

## 1. Pourquoi

Les faces actuelles reprennent le look d'un jeu existant : une mosaïque de polygones et un code couleur par
tranches de valeurs (indigo -2, bleu -1, cyan 0, vert 1–4, jaune 5–8, orange 9–11, rouge 12). C'est
précisément ce qui rend les cartes reconnaissables comme une copie. Vesper doit avoir **sa propre
identité de carte**, reconnaissable au premier coup d'œil.

## 2. État actuel (à lire avant de commencer)

- **Rendu de la carte** : `src/components/virtual/SkyjoCard.jsx` (~500 lignes)
  - `MOSAIC_COLORS` + `MosaicPattern` : la mosaïque SVG → **à remplacer entièrement**.
  - Cas spéciaux : `20` (darkred), `-10` (violet), `S` / `C` (special), `CH` (gold), `H` (black),
    icônes lucide (`RefreshCw`, `Sparkles`, `HelpCircle`, `Orbit`).
  - Tailles via `sizeStyles` (`xs`… `lg`, `custom`) ; dos de carte via `getCardSkinPath(cardSkin)`.
  - Variable CSS `--card-accent` utilisée par les styles de sélection/cible.
- **Styles** : `src/styles/Tabletop.css` (classes `skyjo-card*`).
- **Moteur** : `src/lib/skyjoEngine.js` attribue un champ `color` à chaque carte.
  **Ne pas modifier le moteur ni le champ `color`** : il circule dans l'état des parties en ligne et
  côté serveur. La nouvelle face doit se baser sur `card.value` / `card.specialType`, et ignorer
  `card.color` (sauf en dernier recours de compatibilité).
- **Utilisée par** : PlayerHand, DrawDiscard, DrawDiscardPopup, DrawDiscardTrigger, CardAnimationLayer,
  DiscardHistoryOverlay, RoundResultsPlayers, SwapReveal, VirtualGame, Tutorial, BonusTutorial.
- **Cartes Fury** : rendu à part dans `src/components/virtual/FuryUI.jsx` (déjà une DA par carte) → hors
  périmètre, sauf harmonisation légère de la typographie si besoin.
- **Dos de carte** : `public/card-backs/*.svg` (skins débloquables, ids stockés dans les profils) → les
  ids ne changent pas ; seul `classic.svg` est à redessiner dans la nouvelle DA (les autres plus tard).

## 3. Nouvelle direction artistique

Thème Vesper : **le ciel du soir**. Une carte = un petit morceau de ciel crépusculaire, comme une tuile
de pierre polie ou d'émail, avec le nombre gravé/émaillé au centre.

- **Matière** : surface lisse type émail/céramique, léger relief (biseau doux, reflet en haut),
  bordure fine crème/or pâle. Pas de mosaïque, pas de polygones, pas de motif « vitrail ».
- **Typographie** : un chiffre central **grand et très lisible** (police arrondie et épaisse, ex.
  « Fredoka », « Baloo 2 » ou « Nunito » ExtraBold, en local dans le build), plus un petit rappel du chiffre
  dans deux coins opposés. Le signe « − » des négatifs doit être évident, même en petite taille.
- **Couleur = température du ciel**, en **dégradé continu** et non par tranches :
  chaque valeur a sa propre teinte, de la nuit fraîche à la braise du couchant.

  | Valeur | Ambiance | Teinte indicative |
  |---|---|---|
  | -2 | nuit profonde, étoiles nettes | bleu nuit #1e2a5a → argent |
  | -1 | nuit claire | bleu ardoise #2f4a7a |
  | 0 | heure bleue, horizon | turquoise brumeux #3f7f8f |
  | 1 → 4 | début du soir | sauge → vert d'eau (4 nuances distinctes) |
  | 5 → 8 | lumière dorée | sable → miel → ambre (4 nuances) |
  | 9 → 11 | couchant | pêche → corail → terre cuite |
  | 12 | braise | rouge brique profond #8e2f2a |

  Les teintes sont indicatives : Codex peut les ajuster pour le contraste, mais **deux valeurs voisines ne
  doivent jamais avoir exactement la même couleur**, et l'ensemble ne doit pas reproduire les 5 familles
  de couleurs actuelles.
- **Motif d'identité (léger)** : un petit astre en filigrane dont la forme évolue avec la valeur, pour
  aider à lire les cartes sans dépendre que de la couleur (daltonisme) :
  négatifs = étoiles (nombre d'étoiles = valeur absolue), 0 = croissant de lune,
  1–12 = soleil qui descend progressivement vers l'horizon (position verticale = valeur).
  Discret : il ne doit jamais gêner la lecture du chiffre.
- **Cartes spéciales** (mêmes valeurs/effets, nouveau look) :
  - `-10` : nuit étoilée violette, constellation dorée ; `20` : éclipse (disque noir, halo rouge).
  - `S`, `C`, `CH`, `H` : fond bleu nuit, **icône dessinée sur mesure** (SVG inline, plus d'icônes lucide
    génériques) dans la même famille de traits ; garder le sens actuel de chaque icône.
- **Dos `classic`** : bleu nuit + prune, petite étoile du soir (Vesper) au centre, bordure crème. Pas de
  texte, pas de logo d'un autre jeu.
- **Interdits** : tout ce qui rappelle la mosaïque et le code couleur actuels, ou d'autres jeux de cartes
  connus ; texte autre que les chiffres ; images bitmap lourdes pour les faces (tout en SVG/CSS).

## 4. Étape 1 — maquettes AVANT le code (obligatoire)

Créer `docs/card-mockups.html` (fichier autonome, ouvrable dans un navigateur, sans build) montrant :
1. La gamme complète -2 → 12 + `-10`, `20`, `S`, `C`, `CH`, `H`, et le dos `classic`.
2. Chaque carte en taille réelle `md` et en taille `xs` (lisibilité).
3. Une grille de jeu 3×4 mélangée (cartes cachées + révélées) sur le fond de table actuel.
4. Une ligne en simulation daltonisme (filtre CSS deutéranopie) pour vérifier que l'astre et le chiffre
   suffisent.
5. Les états : sélectionnée, cible (`--card-accent`), désactivée.

**S'arrêter ici et ouvrir une PR brouillon** avec des captures de la planche. Nyaru valide (ou demande des
retouches) avant toute modification de `SkyjoCard.jsx`.

## 5. Étape 2 — intégration (après validation)

- Réécrire la face dans `SkyjoCard.jsx` : une table `VALUE_STYLES` (valeur → dégradé, couleur du chiffre,
  accent, motif) remplace `MOSAIC_COLORS`/`MosaicPattern`. Garder **les mêmes props, tailles et classes
  publiques** (`skyjo-card`, `skyjo-card--selected`, `skyjo-card--target`…) pour ne rien casser chez les
  composants appelants.
- `--card-accent` doit toujours être défini (accent propre à chaque valeur).
- Performances mobiles : pas de filtre SVG coûteux (`feTurbulence`, gros `blur`) par carte ; une grille
  de 12 cartes × 2–6 joueurs doit rester fluide. Préférer dégradés CSS et SVG simples, partagés par `id`
  stable (attention aux collisions d'`id` SVG quand plusieurs cartes identiques sont affichées : garder
  le `useId()` existant).
- Police : fichier local dans `public/fonts/` (ou via `@fontsource`), **disponible hors ligne**
  (pré-cache PWA, cf. `includeAssets` dans `vite.config.js`).
- Redessiner `public/card-backs/classic.svg` (même nom de fichier).
- Mettre à jour les tutoriels si un texte décrit les couleurs (« les cartes vertes… ») :
  `grep -rni "vert\|jaune\|orange\|rouge\|bleu" src/components/Tutorial.jsx src/components/BonusTutorial.jsx`.

## 6. Méthode de travail

1. Partir du **dernier `master`** (`git pull`) — le projet bouge depuis d'autres postes.
2. Branche `codex/cartes-vesper`, **PR vers `master`**, **jamais de push direct sur `master`**
   (déploiement production automatique).
3. Avant de demander la relecture finale : `npm test` (tous verts), `npm run lint` sans nouvelle erreur sur
   les fichiers touchés, `npm run build` OK.
4. Vérifier en jeu (`npm run dev`) : partie contre l'IA en mode classique, Tourment et Fury ; pioche,
   défausse, échange, animation de carte, résultats de manche ; sur une largeur mobile (375 px).
5. Version suivante dans `package.json` / `package-lock.json`.

## 7. Critères d'acceptation

- [ ] Maquettes validées par Nyaru avant intégration.
- [ ] Plus aucune trace de la mosaïque ni du code couleur par tranches.
- [ ] Chiffres lisibles en taille `xs` ; négatifs évidents ; lisible en simulation daltonisme.
- [ ] Moteur, serveur, règles et champ `card.color` inchangés ; parties en ligne compatibles avec les
      clients pas encore mis à jour.
- [ ] Fluide sur mobile, fonctionne hors ligne (police comprise).
- [ ] Tests, lint, build OK ; PR vers `master`, pas de push direct.

## 8. Hors périmètre (étapes suivantes)

Nouvelle composition du paquet et mécaniques propres à Vesper (ex. « constellations »), renommage
interne de `SkyjoCard`/`skyjoEngine`, refonte des autres dos de carte : briefs séparés plus tard.
