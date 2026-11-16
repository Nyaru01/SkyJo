# SkyJo — plan de direction artistique (méthode frontend-design)

## Sujet
Jeu de cartes mobile (PWA). Douze cartes face cachée en grille 3×4, valeurs de −2 à 12 codées par couleur, le plus petit score gagne. Public : joueurs occasionnels, souvent entre amis. Tâche principale de l'accueil : lancer une partie en un geste.

## Ce qui est le plus caractéristique
La grille de cartes et l'échelle de couleurs des valeurs (indigo −2 → sarcelle 0 → vert → jaune → orange → rouge 12). C'est l'élément audacieux unique : la table 3D avec de vraies cartes. Tout le reste est calme.

## Jetons
| Nom | Hex | Rôle |
|---|---|---|
| Encre | #2A2140 | texte, action principale |
| Ciel | #C9DCEF | fond (dégradé pêche → ciel → sarcelle) |
| Pêche | #F6CDBD | haut du ciel, barre d'état |
| Lilas | #6A55B4 | dos de carte, identité |
| Menthe | #23B383 | vous / votre tour |
| Corail | #EF6F57 | adversaire / son tour |

Typographie : **Bricolage Grotesque** seule (variable : graisse et largeur). Titres 800 en largeur un peu serrée, chiffres des cartes 800, texte courant 400–500. Casse normale partout ; aucune étiquette en capitales espacées.

## Maquette accueil (mobile)
```
[▣ SKYJO]                     (avatar·niv) [cloche] [réglages]
[  Réel  |  Virtuel  ]
Le plus petit score gagne.                ← titre concret, sans sur-titre
╔══════════ table 3D (seul élément fort) ══════════╗
╚══════════════════════════════════════════════════╝
[ ▶  Partie rapide                     contre l'IA normale ]  ← une action
  Défis        Contre l'IA        En ligne                   ← rangée calme, sans cartes
  Nouveautés                               v3.3.26
```

## Principes
1. Une seule chose spectaculaire : la table. Pas de reflets sur les boutons, pas d'apparition en cascade, pas de halos décoratifs.
2. La structure informe : couleur menthe/corail = à qui c'est ; rien d'autre n'est coloré sans raison.
3. Le texte dit ce qui se passe : « Piochez ou prenez la défausse », « L'IA réfléchit », « Son tour ».

## Relecture anti-générique (avant de coder)
- Retiré : sur-titre « SOLO · NORMAL » (capitales + point médian), trois tuiles identiques, reflet animé des boutons, cascade d'apparition, chevron d'appel.
- Remplacé : Outfit (choix par défaut) → Bricolage Grotesque ; « Le jeu prend de la hauteur » → « Le plus petit score gagne. »
- Conservé : le ciel et les couleurs joueur, qui encodent une information.

## Réalisé (13 novembre 2026)
- Typographie : Bricolage Grotesque partout (CSS, Tailwind, textures 3D des cartes).
- Accueil : titre « Le plus petit score gagne. », action unique à l'encre (Partie rapide / contre l'IA normale), trois liens calmes à icône au lieu de trois cartes identiques ; sur-titre en capitales, chevron, reflet animé et apparition en cascade supprimés.
- Règle du miroir : cartes lointaines de la scène 3D retirées ; ombre sous la table resserrée (elle formait une bande grise).
- Ciel unifié et nettoyé (arrêt lavande retiré) sur accueil, menus et table.
- Jeu : libellés en casse normale (Pioche, Défausse, badges joueurs, « Piochez ou prenez la défausse »). « DERNIER TOUR » reste en capitales (alerte, et la logique s'appuie sur ce texte).
- Build OK, vérifié en 375 × 812 sur l'accueil. Écran de jeu non revu en image après le passage en casse normale.

## Itération three.js : le monde en plein écran
Diagnostic : l'accueil restait une page d'app avec un widget 3D dans une bande ; l'identité « ciel » n'existait pas dans la scène.
- Canvas 3D fixé en plein écran derrière l'interface ; l'interface flotte au-dessus, la zone héros laisse passer les taps vers les cartes.
- Mer de nuages en volume (sprites à sommet éclairé et dessous bleuté), nuages porteurs sous la table, nuages hauts au loin, soleil, brume calée sur la distance caméra.
- Caméra : objectif 50°, angle 31°, cadrage calculé selon la taille d'écran (table à ~40 % de la hauteur, 31 % en mode réel), plus de débordement.
- Mode réel : titre « Vos cartes, nos calculs. », table réduite, sans bulle d'aide.

## Nouvelle direction : « écrin de nuit » (premium, 3D)
Demande : style jugé affreux, viser du premium et une 3D spectaculaire.
- Scène (three.js + drei + postprocessing) : grande carte SKYJO nuit et or à reflets irisés qui surgit du sol en tournant, douze valeurs en orbite, sol laqué miroir, anneaux d'or lumineux, poussière d'or, éclairage studio (Lightformers), bloom et vignettage, brume nocturne.
- Interactions : la scène suit le doigt et le gyroscope ; tap sur la carte SKYJO = virevolte ; tap sur une valeur = elle se retourne ; vibration courte.
- Qualité adaptative (PerformanceMonitor) : si l'appareil peine, sol brillant simple et pas de bloom.
- Interface de l'accueil en sombre premium : texte ivoire, action principale or champagne, verre fumé, barre de navigation nuit à onglet doré, barre d'état #070919.
- Poids du module 3D : 274 Ko gzip (chargé à part).
- Non testé : rendu « haute qualité » (bloom, sol miroir) et fluidité sur téléphone réel ; le panneau de prévisualisation n'a pas de GPU (3 im/s).
- Reste à faire si la direction plaît : table de jeu, menus et dos de cartes dans cette direction (le jeu est encore en ciel pastel).

## Direction retenue par l'utilisateur : esprit Monument Valley (scène originale)
Référence donnée par l'utilisateur : la DA de Monument Valley. Scène originale dans cet esprit, sans reprendre personnages, décors ni niveaux du jeu.
- Diorama isométrique (caméra orthographique) en aplats : parvis crème avec la grille de 12 cartes, assises corail qui s'affinent vers la brume, bassin menthe, escalier vers le vide, tour à arche lavande rosé et coupole, grande carte qui pivote au sommet, deux arbres ronds, petits blocs flottants.
- Animations : l'île émerge de la brume, les cartes se retournent en vague, la carte du sommet pivote ; tap = retourner une carte / faire tourner la carte du sommet ; inclinaison douce au doigt et au gyroscope.
- Cartes pastel (chiffres en Cormorant Garamond), dos crème-rose à losanges au trait.
- Interface : ciel pêche → rose → lavande, titres en Cormorant Garamond, action principale prune arrondie, liens au trait, navigation en verre clair.
- Sans post-traitement : bien plus léger que la version nuit. Les versions nuit et nuages sont sauvegardées hors du projet.

### Extension du belvédère au reste de l'app
- Dos « Classique » régénéré : dégradé corail → lavande, géométrie au trait blanc, cadre crème. Le diorama de l'accueil affiche le dos choisi par le joueur.
- Table : même ciel que l'accueil ; plateaux = dalle de pierre crème posée sur des assises corail (comme l'île), intérieur légèrement teinté (sauge pour vous, rose pour l'adversaire) ; anneau de tour menthe / corail adouci ; noms, scores, piles et consignes en Cormorant Garamond.
- Correctif : les halos de HaloEffects.css peignaient un fond ardoise (::after) sous le bandeau central ; coupés sur la table.
- Menus : même ciel, titres en Cormorant Garamond.
- Vérifié en partie (phase « Retournez 2 cartes ») et sur le menu Jouer.

### Accueil sans « Partie rapide »
- Bouton « Partie rapide » retiré (demande utilisateur). L'accueil virtuel propose un menu en serif centré : Contre l'IA (entrée principale, en prune), En ligne, Défis, séparés par de fins ornements en losange. Si une partie est en cours, « Reprendre la partie » apparaît en tête.
- Sélecteur Réel / Virtuel allégé (texte seul, losange corail sous l'option active) ; mini-logo en pastel.
- Île recadrée : plus petite et dégagée du menu, pied raccourci qui se fond dans la brume ; cadrage spécifique en mode réel.

### Itération : animation à la place de l'aide, vrais boutons, emblèmes dessinés
- Bulle « Touchez une carte » retirée. L'île vit seule : une carte se retourne d'elle-même toutes les ~2 s, le haut de la tour (balcon et porte) pivote d'un quart de tour toutes les ~4 s, la brume dérive, l'eau du bassin ondule.
- Menu en vrais boutons pleine largeur (relief, appui visible, chevron) ; le premier (Contre l'IA, ou Reprendre si une partie est en cours) est prune plein.
- Pictogrammes génériques remplacés par des emblèmes SVG dessinés en volumes isométriques pastel (src/components/home/HomeGlyphs.jsx) : duel de cartes, tours reliées, pyramide à fanion, sablier.

### Mascotte de l'IA en 3D
- Nouvelle mascotte temps réel (src/components/virtual/Mascot3D.jsx), dans le style belvédère : corps crème arrondi, visage-écran prune, bandeau et oreilles à la couleur du niveau, antenne à gemme (flamme en Tourment), mains flottantes, ombre douce.
- Humeurs : Normal menthe (yeux ronds, sourire), Difficile ambre (regard plissé), Hardcore lavande (sourcils froncés, rictus), Tourment rose (flamme, grand sourire).
- Animations : flottement, clignement aléatoire, la tête suit le doigt, gemme qui tourne, mains qui ondulent ; tap = saut avec écrasement/étirement et tour complet ; changement de niveau = petit saut.
- RobotAvatar garde la même interface ; l'ancien sprite sert de repli (chargement, pas de WebGL, erreur 3D). Module : 2,6 Ko gzip.
- Vérifié dans le duel IA (4 niveaux) et le défi quotidien.

### Plateaux teintés
- Les plateaux de jeu ne sont plus blancs : sauge-menthe pour vous, rose-corail pour l'adversaire, rebord translucide, tranche dans la même famille de couleur.
- Fonds débloqués sombres (ex. Cyber City) : libellés Pioche / Défausse en clair avec ombre.

### Maturité (retour « trop enfantin »)
- Diagnostic : pastels bonbon saturés, arrondis très marqués, bordures épaisses, doubles tranches colorées, halos et robot rondouillard donnaient un aspect jouet. Monument Valley doit sa tenue à sa retenue.
- Palette poudrée et désaturée partout : ciel ivoire → gris lilas → ardoise, pierre mate, sauge grisée (vous), terre cuite douce (adversaire), une seule couleur d'action indigo ardoise #3d4466.
- Formes nettes : arrondis 10-14 px, filets fins, une seule tranche fine, plus de halo sur le tour actif (anneau 1,5 px).
- Dos « Classique » : indigo profond à filets ivoire. Île, cartes du parvis, emblèmes et mascotte repassés dans les mêmes tons.
- Correctif : libellés Pioche / Défausse centrés au-dessus de leur pile (ils étaient décalés de 24 px en phase de choix) ; dalle centrale symétrique.
- Bouton « Affronter l'IA » dans la couleur d'action.

### Crépuscule et animation de l'accueil
- Accueil et table (fond Original) au crépuscule : ciel ardoise → mauve éteint, texte ivoire, boutons en verre fumé, action principale ivoire, navigation nuit, barre d'état #1f2233. Les menus intermédiaires restent clairs (textes posés sur le fond).
- Île éclairée en soleil couchant (lumière chaude à gauche, froide à droite), fenêtre de la tour allumée, brume mauve.
- Animations : entrée cinéma (zoom avant + l'île pivote puis se pose), étoiles qui scintillent, lucioles qui montent, petite lueur qui gravit l'escalier et va jusqu'à la tour puis redescend ; en plus des cartes qui se retournent et de la tour qui pivote.

### 14/11 — Vie de la scène et finitions (après le passage de Codex)
- Serveur local relancé (Vite, http://localhost:5173). Copie locale identique à master (60c1cae, Codex).
- Oiseaux de papier : trois origamis ivoire qui font le tour de l'île, battements par à-coups et glissades.
- Mécanisme : toucher la tour la fait pivoter d'un quart de tour, la carte du sommet fait un tour complet, les lanternes s'embrasent un instant ; sinon la tour pivote seule toutes les ~6 s.
- Lumière vivante : le soleil couchant varie lentement d'intensité et de teinte (doré → rosé) ; les lanternes vacillent.
- Finitions : voile dégradé derrière le menu, icônes d'en-tête au trait fin, appui des boutons plus franc, pied de page discret (Nouveautés en lien, version en petit).
- Remarqué : le guide de bienvenue (nouveaux joueurs) est resté dans l'ancien style lavande.

### Guide de bienvenue au style crépuscule
- Tutorial.jsx réécrit avec son propre style (src/styles/Guide.css) au lieu du thème générique : panneau nuit ardoise, texte ivoire, titres en Cormorant, progression en segments fins, bouton principal ivoire comme sur l'accueil.
- Photo de la première étape remplacée par une petite île isométrique dessinée en SVG (aucune image chargée).
- Textes en casse normale, sans émojis ; contenu pédagogique inchangé (9 étapes). Cartes colorées selon la répartition du moteur.
- Vérifié étape par étape en 375 × 812.

## 14/11 — Menus au crépuscule et saisons de l'accueil

- Tous les menus (Jouer, Social, Stats, Profil, Réglages, barre de navigation) passent au même crépuscule que l'accueil : verre de nuit, encre ivoire, bouton principal ivoire.
- Saisons (src/lib/season.js) : automne jusqu'au 20 décembre, **neige à partir du lundi 21 décembre 2026**, printemps le 20 mars, été le 21 juin. Test forcé : `?saison=hiver|automne|printemps|ete`.
- Automne : feuilles rousses qui tombent, arbres roux. Printemps : pétales. Hiver : neige, place enneigée, bassin gelé, dômes blanchis.
- Toute l'année : étoiles filantes dans le ciel (three.js, traînée additive).

## 14/11 — Plus de blanc, nouvelle tour, vraies feuilles

- Duel IA : carte du rival et mode choisi en verre nuit, accents doux, bouton « Affronter l'IA » ivoire.
- Fenêtre du pseudo redessinée (style du guide, « Comment vous appeler ? »).
- Table de jeu : plateaux en pierre sombre teintée (mousse pour vous, brique pour l'adversaire), barre du haut, pastilles de score, consignes et dalle centrale en verre nuit.
- Tour : socle à deux gradins, arche avec lanterne suspendue qui se balance, salle haute à fenêtres en plein cintre éclairées et pilastres d'angle, corniche, tambour octogonal, coupole, épi doré, anneau doré qui tourne sous la carte (s'emballe quand on touche la tour).
- Feuilles : silhouettes d'érable et de feuille ovale dessinées avec nervures, pli central, chute en balancier ; certaines se posent sur le parvis puis s'effacent. Pétales au printemps.
