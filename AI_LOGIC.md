# Fonctionnement de l'IA Skyjo

Ce document explique les algorithmes et les stratégies utilisés par l'Intelligence Artificielle (IA) dans les différents modes de difficulté du jeu.

## 🧠 Niveaux de Difficulté

L'IA dispose de quatre niveaux de comportement, allant du simple amateur au maître stratège.

| Niveau | Nom | Stratégie Globale |
| :--- | :--- | :--- |
| **Normal** | Amateur | Joue de manière basique, prend peu de risques et ne planifie pas ses colonnes. |
| **Difficile** | Stratège | Vise les coins, construit des colonnes et **bloque l'adversaire**. |
| **Hardcore** | Maître | Analyse mathématiquement chaque coup et **optimise les combos**. |
| **Tourment** | Expert (Bonus) | Gère les cartes spéciales, la Tête de Mort et les stratégies avancées. |

---

## 🃏 Phases de Jeu

### 1. Révélation Initiale
Comment l'IA choisit ses deux premières cartes à retourner :
- **Normal** : Choix totalement aléatoire.
- **Difficile+** : Privilégie les **coins** (0, 2, 9, 11). Cela lui permet d'avoir une meilleure visibilité pour construire ses colonnes dès le début.

### 2. Pioche vs Défausse
- **Normal** : Prend la défausse si la carte est $\leq 4$ ou si elle complète une colonne.
- **Difficile+** : 
    - Prend **systématiquement** les cartes négatives ($-1, -2$) ou la carte **Échange**.
    - Analyse si la carte de la défausse peut former un "Skyjo" (3 cartes identiques).
    - Ne remplace jamais une carte "Excellente" ($\leq 0$) par une carte de la défausse, sauf pour compléter une colonne.

### 3. Actions (Remplacer vs Défausser)
C'est ici que l'IA montre son intelligence :
- **Priorité Absolue** : Compléter une colonne (Skyjo). Si l'IA peut aligner 3 cartes identiques, elle le fera, sauf si cela implique de supprimer trois cartes très négatives (ex: trois $-2$).
- **Stratégie Multi-Colonnes (Combos)** : L'IA Hardcore privilégie maintenant de garder des valeurs qu'elle possède déjà sur son tapis, même dans des colonnes différentes, pour augmenter ses chances de piocher une troisième carte identique et déclencher une élimination.
- **Anticipation (Blocage)** : 
    - L'IA vérifie le tapis de l'adversaire (l'humain) avant chaque action.
    - Elle ne te donnera pas une carte dont tu as besoin pour finir une colonne. Si elle pioche une carte qui t'aiderait, elle la gardera pour elle (même si elle est un peu haute) ou la remplacera pour ne pas te la laisser en défausse.
- **Gestion des cartes cachées** :
    - L'IA "Hardcore" calcule un score pour chaque emplacement caché.
    - Elle préfère révéler des cartes dans les colonnes où elle a déjà commencé à construire une paire.
- **Seuils de décision** :
    - L'IA remplace ses cartes révélées si la nouvelle carte apporte un gain significatif (généralement une différence de 2 à 4 points).

---

## ⚡ Mode Bonus (Tourment)

Dans ce mode, l'IA utilise des logiques spécifiques pour les cartes spéciales :

- **Échange (S)** : L'IA l'utilise s'il possède une carte révélée très haute ($> 8$). Il cherchera alors à te donner sa pire carte contre ta meilleure carte révélée (ou une cachée s'il pense avoir de la chance).
- **Trou Noir (H)** : Toujours activé dès que pioché pour perturber le jeu.
- **Tête de Mort (20)** : L'IA subit la règle du remplacement forcé. Il tentera de la placer sur une colonne qu'il compte éliminer plus tard ou sur une de ses cartes déjà hautes pour limiter les dégâts.

---

## 💡 Conseils pour gagner
- L'IA ne sait pas mentir, mais en mode **Hardcore**, elle ne fait quasiment aucune erreur de calcul.
- En mode **Tourment**, garde tes meilleures cartes cachées le plus longtemps possible pour éviter que l'IA ne te les vole avec une carte Échange !
