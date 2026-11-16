# 🤖 Intelligence Artificielle Skyjo (Brain V2)

Ce document détaille l'architecture et les stratégies de l'IA Skyjo "Brain V2", un moteur de décision probabiliste et tactique.

---

## 🏗️ Architecture Technique

Le système est découplé en trois couches :
1.  **[skyjoAI.js](../src/lib/skyjoAI.js)** : Le **Cerveau**. Contient les fonctions de décision pures (heuristiques, probabilités, blocking).
2.  **[virtualGameStore.js](../src/store/virtualGameStore.js)** : L'**Orchestrateur**. Gère le cycle de vie du tour IA et le timing.
3.  **[VirtualGame.jsx](../src/components/VirtualGame.jsx)** : L'**Interface**. Traduit les décisions logiques en animations visuelles.

---

## 🧠 Stratégies Avancées (Brain V2)

L'IA ne se contente plus de réagir, elle anticipe et calcule ses risques.

### 1. Modèle Probabiliste (EV)
L'IA maintient une estimation de l'**Espérance de Valeur (EV)** du deck. 
- Elle compte les cartes visibles sur le tapis et dans la défausse.
- Elle calcule la valeur moyenne des cartes restantes ($EV_{deck} \approx 5.3$ au début).
- **Impact** : Elle ne remplacera un 6 révélé que si l'EV du deck est nettement meilleure.

### 2. Déni Stratégique (Blocage)
Avant de jeter une carte, l'IA scanne votre tapis :
- **Détection de patterns** : Elle repère si vous avez deux cartes identiques (révélées ou cachées).
- **Rétention** : Si la carte piochée complète votre colonne, elle la **garde** (même si elle est mauvaise pour elle) pour vous étouffer.

### 3. Gestion du Tempo & Finisseur Prudent
L'IA ajuste son agressivité selon le score différentiel :
- **Accélération** : Si elle mène ($Score_{IA} < Score_{Joueur} - 5$), elle cherche à révéler ses cartes pour finir la manche le plus vite possible.
- **Finisseur Prudent (Nouveau)** : Si elle est dominée ($Score_{IA} > Score_{Joueur} + 10$), elle refuse catégoriquement d'agir sur sa dernière carte cachée. Elle préfère utiliser ses tours restants pour remplacer des cartes déjà révélées par de meilleures valeurs afin de minimiser ses points avant que l'adversaire ne finisse.

### 4. Expansion Multi-Colonnes 2.0
Lorsqu'elle possède déjà une valeur, elle ne choisit plus une carte cachée au hasard pour commencer un combo.
- Elle cible les colonnes avec le plus gros potentiel (colonnes vides ou avec des cartes à sacrifier).

### 5. Révélation Initiale Tactique
En mode Hardcore, l'IA révèle deux cartes d'une **même colonne** (priorité aux coins). Cela maximise ses chances de match immédiat et stabilise sa structure de jeu dès le tour 1.

### 6. Gestion de la Défausse (Aggressive Mode)
Nouveauté majeure de la V2 : l'IA évite de s'encrasser avec des cartes médiocres.
- **Cartes <= 4** : L'IA peut les piocher en défausse pour créer un potentiel de colonne (si une seule carte identique est visible).
- **Cartes >= 5** : L'IA ne les prend en défausse que pour **compléter** une colonne (si deux cartes identiques sont déjà présentes).
- **Impact** : Elle préférera piocher dans le deck (tentative de 0, -1, -2) plutôt que de prendre un 7 "par défaut".

---

## 🎮 Niveaux de Difficulté

| Niveau | Caractéristiques V2 |
| :--- | :--- |
| **Normal** | Decision 100% réactive. Pas de blocking. Pas de gestion de l'EV. |
| **Difficile** | Blocking simple. Ouverture des coins. Heuristique basique. |
| **Hardcore** | **Brain V2 Complet**. EV dynamique, Blocage avancé, Gestion du tempo. |
| **Tourment** | **Brain V2 + Bonus**. Utilisation optimale des cartes Action (Swap, Trou Noir). |

---

## 💡 Conseils de Pro
- **Ne piégez pas l'IA** : Elle connaît l'EV. Si vous laissez un -2 en défausse, elle ne le prendra pas seulement pour le score, mais aussi si cela bloque votre propre combo.
- **Cachez vos paires** : Si vous révélez deux 9, l'IA ne jettera plus AUCUN 9 dans la défausse.
