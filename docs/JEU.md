# Vesper — fonctionnement du jeu

Ce document décrit le jeu tel qu'il est codé aujourd'hui (v3.16.x). Les règles de base sont celles du Skyjo
(texte officiel dans `docs/reference/`) ; Vesper y ajoute des modes, une IA, une progression et des défis.

## 1. Règles de base

- Chaque joueur a **12 cartes** face cachée, en grille de 4 colonnes × 3 rangées. Valeurs de −2 à 12.
- **Début de manche** : chacun retourne 2 cartes.
- **À son tour** : on pioche (pioche ou défausse), puis on **remplace** une carte de sa grille par la carte piochée,
  ou on **défausse** la carte piochée et on **retourne** une de ses cartes cachées. Une carte prise dans la défausse
  doit être placée.
- **Colonne nettoyée** : trois cartes identiques dans une colonne disparaissent.
- **Fin de manche** : dès qu'un joueur a tout retourné, les autres jouent un dernier tour. Si celui qui a fini n'a pas
  le score le plus bas, **son score est doublé** (s'il est positif).
- **Fin de partie** : quand un joueur atteint **100 points**. Le plus petit total gagne.

Code : `src/lib/skyjoEngine.js` (moteur pur, testé), `src/lib/scoreUtils.js`.

## 2. Modes de jeu

### Contre l'IA (`src/store/virtualGameStore.js`)

| Mode affiché | Réglage interne | Particularités |
| --- | --- | --- |
| **Normal** | IA `hard` | Duel équilibré, règles de base |
| **Difficile** | IA `hardcore` | IA la plus forte ; **colonne nettoyée = −3 points** |
| **Tourment** | IA `bonus` | 24 cartes spéciales (−10, Crâne 20, Échange, Nettoyage, Trou noir, coffres…) et colonne = −3. Voir [MODE_TOURMENT.md](MODE_TOURMENT.md) |
| **Fury** | moteur Fury + IA `hard` | Cartes de sabotage (section 3) et colonne = −3 |

Avant le premier duel, le jeu demande un pseudo (il apparaît au classement).

### En ligne (`src/store/onlineGameStore.js`, serveur `server/index.js`)

Salons entre amis, synchronisés par Socket.io. Modes : classique, `bonus` (Tourment) et `fury`.
Le **serveur arbitre** toutes les actions (il applique le même moteur que le jeu solo) ; détails dans [SERVEUR.md](SERVEUR.md).

### Édition réelle

Mode « calculateur » pour une vraie partie de Skyjo autour d'une table : on saisit les scores de chaque manche
(`src/components/ScoreInput.jsx`, `RoundHistory.jsx`).

## 3. Mode Fury (`src/lib/furyEngine.js`)

Six cartes de sabotage, **2 exemplaires de chaque** (12 cartes), cachées dans la pioche :

| Carte | Effet |
| --- | --- |
| Séisme | Remet une colonne adverse à zéro (cartes renvoyées sous la pioche, remplacées par des cachées) |
| Malédiction | Remplace une carte adverse **déjà retournée** par un +13 bloqué 3 tours |
| Brouillard | Recache 2 cartes adverses |
| Tornade | Mélange les cartes adverses |
| Gel | Gèle une colonne adverse 2 tours (impossible d'y remplacer une carte) |
| Bouclier | Ne se joue pas : gardé en réserve, il bloque tout seul la prochaine Fury reçue |

Règles :
- Les Fury sont réparties dans les **48 cartes du dessus** de la pioche (`FURY_SPREAD_DEPTH`) : environ 2 à 3 Fury
  piochées par joueur et par manche.
- Piocher une Fury l'envoie dans la **réserve** (3 au plus), puis on pioche normalement. Les deux cartes s'affichent
  dans la même fenêtre (« Deux cartes piochées »).
- Jouer une Fury **remplace la pioche** du tour. **3 Fury au plus par manche**, jamais au dernier tour.
- Une Fury piochée **n'est pas jouable dans le même tour** (y compris pour l'IA).
- Une Fury reçue s'annonce par une onomatopée puis un bandeau posé sur la zone pioche/défausse (2,5 s).

## 4. Intelligence artificielle (`src/lib/skyjoAI.js`)

Décisions pures et testées, appelées par le store au rythme de l'interface. Points clés (détails dans
[AI_LOGIC.md](AI_LOGIC.md)) :
- Choix de la source (pioche ou défausse) selon la valeur attendue des cartes et les colonnes à compléter.
- Placement : colonne complétée immédiatement > remplacement d'une carte visible de 10 à 12 > paires en préparation.
- **Fin de manche prudente** : si elle perd nettement et qu'il lui reste une carte cachée, elle évite de finir la
  manche, sans poser de 10 à 12 ni casser de paire pour gagner un tour.
- Fury : l'IA estime le gain de chaque carte et de chaque cible (`decideFuryAction` dans `furyEngine.js`).

## 5. Progression

- **XP** (`src/store/gameStore.js`, `addXP`) : +1 par manche gagnée contre l'IA ; défi quotidien +3 (+6 en Tourment),
  une fois par jour ; défis saisonniers +15 à +20.
- **Niveaux** : 10 XP par niveau. **Carrière** (`src/lib/masterCareer.js`) : Challenger (1–99), Maître (100–200),
  Prestige (201+), avec récompenses (dos de cartes, fonds d'écran : `src/lib/rewards.js`).
- **Rang de performance** (`src/lib/tourmentPerformance.js`), affiché à la victoire d'une partie à 100 points :
  - Tourment : score positif / 0 à −49 / −50 à −99 / −100 et moins ;
  - Fury : plus de 60 / 36 à 60 / 11 à 35 / 10 et moins.
- Le profil (pseudo, avatar, niveau, XP, défis) est sauvegardé localement **et** sur le serveur
  (voir [AUTHENTIFICATION.md](AUTHENTIFICATION.md)).

## 6. Défis

- **Défi quotidien** : une partie contre l'IA par jour, XP bonus.
- **Défis saisonniers** (`src/lib/weeklyChallenge.js`, `season.js`) : Équinoxe, Récolte d'automne, Nuit du Solstice
  (à partir du 21 décembre 2026), chacun avec un objectif sur le plateau et une récompense.

## 7. Social (`src/components/SocialMenu.jsx`, `Leaderboard.jsx`)

- **Vesper ID** (ex. `#MR1BY1`) pour ajouter des amis ; recherche par ID ou par nom.
- Classement global avec podium animé, amis et joueurs en ligne, chat privé, invitations à une partie.

## 8. Interface de partie (`src/components/VirtualGame.jsx`)

- **Début de manche** : un voile couvre les plateaux et un arc de lumière part de la pioche pour les révéler,
  synchro sur les deux plateaux (`PlayerHand.jsx`, `.skyjo-scan` dans `Tabletop.css`). Les cartes ne bougent pas :
  c'est volontaire (24 cartes 3D animées saccadaient). L'IA attend la fin (`src/lib/dealTiming.js`).
- **Taille des cartes** : calculée avant le premier affichage pour remplir l'écran sans défilement (`src/lib/fitCards.js`).
- **Barre du haut** : retour, numéro de manche, musique, pause. **Pause** : règles du seul mode en cours.
- **Fin de partie** : panneau dédié (`src/styles/GameOver.css`) : victoire/défaite, gagnant, rang, classement.
- Animations : CSS de préférence (le moins possible de JavaScript image par image), toutes désactivées si le
  téléphone demande moins d'animations (`prefers-reduced-motion`).

## 9. Tests

```bash
npm test
```

Moteur, IA (dont les cas « coups absurdes » corrigés), Fury, carrière, prestige, défis, coffres, synchronisation du
profil, migrations de la base et authentification admin.
