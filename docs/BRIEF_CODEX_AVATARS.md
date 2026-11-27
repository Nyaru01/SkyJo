# Brief Codex — Refonte des avatars de Vesper

> Rédigé par Claude pour Codex. Objectif : remplacer les 8 avatars actuels par une nouvelle série dans la
> direction artistique de Vesper, sans rien casser (profils, parties en ligne, hors ligne).
> Après les avatars viendra la refonte des cartes (même DA, on garde des chiffres/nombres).

## 1. Contexte

Vesper est un jeu de cartes en PWA (React 19 + Vite, serveur Node/Express + socket.io, déployé sur Railway
depuis la branche `master` de `github.com/Nyaru01/SkyJo`). Le jeu a été renommé « Vesper » et se détache
de toute identité tierce : **tout ce qui est créé doit être 100 % original**.

Les avatars actuels (`public/avatars/*.png`) sont des animaux en papier découpé (style collage, fond bleu
nuit). Ils ne correspondent plus à la DA, et ils sont lourds : 1024×1024, ~550–710 Ko chacun, ~5 Mo au total
mis en cache hors ligne.

## 2. Direction artistique Vesper (à respecter)

- **Ambiance** : un crépuscule calme et rêveur (« l'étoile du soir »). Référence interne : l'île 3D de
  l'accueil (`src/components/home/HomeWorldScene3D.jsx`) et l'intro `public/vesper-intro.mp4`.
- **Rendu** : 3D douce, matière « argile / pâte polie », formes arrondies, ombres tendres, léger
  contre-jour chaud (rim light pêche/ambre).
- **Palette** : ciel bleu nuit et prune (#1d1b30 → #3a2b4c), lavande (#b9a8d6), pierre crème (#ece5db),
  pêche/ambre (#ffd2a8, #f2b48f), accents sauge (#8fae9f) et turquoise (#5fc8c0).
- **Ton** : bienveillant, curieux, un peu malicieux — jamais agressif ni « kawaii » excessif.
- **Interdits** : personnages existants (films, jeux, mascottes de marques), logos, texte ou chiffres dans
  l'image, filigranes, photoréalisme.

## 3. Ce qu'il faut produire

### 3.1 Les 8 avatars existants, redessinés (obligatoire)

Les **identifiants ne doivent pas changer** : ils sont enregistrés dans les profils (localStorage, base
PostgreSQL) et circulent en ligne. Un id inconnu retombe sur `cat`.

| id | Nom affiché | Idée de personnage (libre d'adaptation) |
|---|---|---|
| `cat` | Chat | chat gris-lavande, petite lanterne au cou |
| `dog` | Chien | chien crème aux oreilles tombantes, écharpe sauge |
| `fox` | Renard | renard roux, feuille d'automne derrière l'oreille |
| `bear` | Ours | ourson brun doux, bonnet tricoté |
| `panda` | Panda | panda tenant une petite étoile dorée |
| `lion` | Lion | lionceau à crinière pêche, couronne de feuilles |
| `frog` | Grenouille | grenouille turquoise, nénuphar sur la tête |
| `monkey` | Singe | petit singe joueur, éventail de cartes (dos uniquement, sans chiffres) |

Chaque avatar :
- **Cadrage** : buste (tête + épaules), de face ou trois-quarts, **centré**, marge de sécurité de 12 % :
  les avatars sont affichés **dans un cercle** de 28 px à 128 px.
- **Lisibilité** : silhouette reconnaissable dès 32 px ; un accessoire Vesper par personnage, discret.
- **Fond** : plein cadre (pas de transparence), dégradé crépuscule commun à toute la série (haut bleu nuit,
  bas prune/pêche) avec 2–3 petites étoiles floues ; une **teinte d'accent propre à chaque avatar** dans le
  halo derrière la tête, pour les distinguer en liste.
- **Cohérence** : même éclairage, même angle de caméra, même échelle de tête pour les 8.

### 3.2 Avatars supplémentaires (facultatif, si le temps le permet)

4 nouveaux personnages dans le même style (ex. hibou, lapin, raton laveur, hérisson), **ajoutés à la fin**
de la liste avec de nouveaux ids — ne jamais renommer ni supprimer un id existant.

## 4. Contraintes techniques

- **Format** : WebP, 512×512, qualité ~80, **≤ 60 Ko par fichier** (cible : toute la série < 600 Ko).
  Nom : `public/avatars/<id>.webp`.
- **Code à mettre à jour** :
  - `src/lib/avatars.js` : chemins → `/avatars/<id>.webp?v=3` (le `?v=` force le rafraîchissement du cache),
    y compris la valeur par défaut de `getAvatarPath`.
  - `src/components/ui/ImagePreloader.jsx` : la liste `CRITICAL_IMAGES` (chemins des avatars).
  - `vite.config.js` : `includeAssets` → remplacer `'avatars/*.png'` par `'avatars/*.webp'` (mise en cache
    hors ligne obligatoire : le jeu doit marcher sans réseau).
  - Vérifier qu'aucun autre fichier n'écrit un chemin `/avatars/*.png` en dur
    (`grep -rn "/avatars/" src server`).
- **Anciens PNG** : les supprimer du dépôt une fois les WebP branchés (ils restent dans l'historique Git).
- **Ne pas toucher** : la logique de jeu, l'IA, le serveur, les styles hors avatars.
- **Écran de choix** (`src/components/AvatarSelector.jsx`) : seulement si nécessaire pour la nouvelle
  série (ex. grille de 12 si avatars supplémentaires). Garder le style actuel des fenêtres.

## 5. Méthode de travail (important)

1. **Partir du dernier `master`** (`git pull`) : le projet est aussi modifié depuis un autre PC et par
   Claude ; ne jamais travailler sur une copie ancienne.
2. Travailler sur une **branche dédiée** `codex/avatars-vesper` et **ouvrir une Pull Request** vers
   `master`. **Ne jamais pousser directement sur `master`** (il déclenche le déploiement en production).
3. Avant la PR : `npm test` (73 tests doivent passer), `npm run lint` sans nouvelle erreur sur les fichiers
   modifiés, `npm run build` sans erreur, et vérifier dans `dist/sw.js` que les `avatars/*.webp` sont
   dans la liste de pré-cache.
4. Dans la PR : une **planche contact** des 8 (ou 12) avatars côte à côte, affichés en cercle à 128 px et à
   32 px, pour valider la lisibilité.
5. Mettre à jour le numéro de version dans `package.json` / `package-lock.json` (3.16.x suivant).

## 6. Critères d'acceptation

- [ ] 8 avatars redessinés, ids inchangés, style homogène Vesper, aucun personnage existant reconnaissable.
- [ ] Chaque fichier ≤ 60 Ko, 512×512, WebP ; série complète < 600 Ko.
- [ ] Reconnaissables à 32 px dans un cercle.
- [ ] Les profils existants affichent automatiquement le nouvel avatar (même id).
- [ ] Hors ligne : avatars présents dans le pré-cache du service worker.
- [ ] Tests, lint (pas de nouvelle erreur) et build OK ; PR ouverte vers `master`, pas de push direct.

## 7. Étape suivante (pour information)

Refonte des **cartes** dans la même DA : on garde des **chiffres / nombres** lisibles, mais on abandonne le
code couleur actuel par tranches de valeurs (hérité d'un jeu existant) au profit d'un système propre à
Vesper. Un brief séparé suivra.
