# Vesper

Vesper : jeu de cartes en application web installable (PWA) : contre l'IA, en ligne entre amis, avec des modes
spéciaux (Tourment, Fury), une carrière, des défis et un classement.

- Production : https://skyjo-scoring-production.up.railway.app
- Dépôt : https://github.com/Nyaru01/SkyJo (branche `master`, **public**)

## Documentation

Vue d'ensemble de l'architecture (navigateur, serveur Railway, services externes) :
[diagramme dans docs/SERVEUR.md](docs/SERVEUR.md#architecture).

| Document | Contenu |
| --- | --- |
| [docs/JEU.md](docs/JEU.md) | Fonctionnement du jeu : règles, modes, IA, Fury, progression, défis, interface |
| [docs/SERVEUR.md](docs/SERVEUR.md) | Serveur : API, temps réel (Socket.io), base de données, variables, déploiement, PWA |
| [docs/AUTHENTIFICATION.md](docs/AUTHENTIFICATION.md) | Identité des joueurs et liaison du compte Google (Firebase) |
| [docs/MODE_TOURMENT.md](docs/MODE_TOURMENT.md) | Cartes spéciales du mode Tourment |
| [docs/AI_LOGIC.md](docs/AI_LOGIC.md) | Stratégies de l'IA |
| [docs/security_plan.md](docs/security_plan.md) | Audit de sécurité et plan d'action |
| [docs/vibrations.md](docs/vibrations.md) | Retours haptiques |
| `docs/archive/` | Anciens rapports, notes et candidats de logo (historique, plus maintenu) |

## Démarrer en local

Prérequis : Node.js 20 ou plus (le serveur de production tourne en Node 20).

```bash
npm ci
```

```bash
cp .env.example .env
```

Renseignez `DATABASE_URL` avec une base locale ou de test. La documentation liste les autres variables.
Une connexion à la base Railway agira sur les données de production, même depuis `localhost`. [Configuration du serveur](docs/SERVEUR.md#variables-denvironnement)

```bash
npm run dev
```

- Front (Vite) : http://localhost:5173 ; il relaie `/api` et `/socket.io` vers le serveur.
- Serveur (Express + Socket.io) : port 3000, relancé automatiquement à chaque modification (`node --watch`).

## Reprise pour Claude

Repères de la version 3.16.31.

- **IA en Fury.** L’IA choisit sa source avant de toucher à la pioche. Prendre un −1 dans la défausse laisse le Séisme au sommet de la pioche et la réserve intacte. Piocher ajoute le Séisme à la réserve si elle a de la place, puis donne la carte normale dans la même action. Ce parcours est géré dans [virtualGameStore.js](src/store/virtualGameStore.js) et la collecte dans [furyEngine.js](src/lib/furyEngine.js).
- **Aperçu de la défausse.** Un appui long sur la pile ou un clic sur son compteur affiche jusqu’à quatre cartes récentes. La carte au sommet est signalée et le panneau reste ouvert au relâchement. Un appui court sur la pile prend la carte lorsque le tour l’autorise. Les gestes sont partagés via [useDiscardHistory.js](src/hooks/useDiscardHistory.js) et le panneau est dans [DiscardHistoryOverlay.jsx](src/components/virtual/DiscardHistoryOverlay.jsx).
- **Intro Nyaru Studio.** Le MP4 servi en local et en production a été comparé à `last_intro.mp4`. Les fichiers sont identiques et la source est en 720 × 1280. Dans Chromium, le fondu des bords ne change pas la netteté au centre. La comparaison du rendu avec VLC reste à faire. [Vidéo utilisée](public/nyaru-studio-intro-v2.mp4) · [Composant de lecture](src/components/IntroScreen.jsx)
- **Vérification locale.** Les scénarios Séisme + −1, pioche normale et réserve Fury pleine ont été rejoués. L’appui long, le relâchement, la fermeture au clavier et la prise par appui court ont été vérifiés à 320 et 404 px. Lancer `npm test` et `npm run build` avant de publier.

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur + front en parallèle |
| `npm run build` | Build de production dans `dist/` (avec le service worker) |
| `npm start` | Serveur seul, qui sert aussi `dist/` |
| `npm test` | Tests (`node --test`) : moteur, IA, Fury, carrière, défis, serveur |
| `npm run lint` | ESLint (des erreurs anciennes subsistent dans quelques gros fichiers) |

## Arborescence

```
src/
  components/      Écrans et composants React (VirtualGame.jsx = la partie)
    virtual/       Plateau, cartes, pioche, Fury, IA
    home/ ui/      Accueil (scène 3D), composants génériques
  store/           État (Zustand) : profil, partie contre l'IA, partie en ligne, social
  lib/             Logique pure et testée : moteur, IA, Fury, carrière, défis…
  styles/          CSS par zone (Tabletop, Fury, GameOver, MenuLobby…)
  sw.js            Service worker (cache, mises à jour, notifications)
server/
  index.js         Express + Socket.io + création de la base
  routes/          API REST : social, feedback/admin, push
  middleware/      Authentification admin, limitation de débit, validation
public/            Fichiers statiques (manifest.json, icônes /brand, avatars, sons, musiques)
scripts/           Outils (génération des dos de cartes)
docs/              Documentation
```

## Publier une version

Une fusion sur `master` déclenche le déploiement Railway. Nixpacks exécute `npm ci`, `npm run build` et `npm start`.

1. Sur une branche de travail à jour de `master`, augmentez la version avec `npm version patch --no-git-tag-version`. Cette version s’affiche dans le jeu et sert au contrôle des mises à jour.
2. Lancez `npm test` et `npm run build`, puis ouvrez une pull request vers `master`.
3. Après la fusion et le déploiement, contrôlez la version retournée par l’API et ouvrez le jeu dans une session de navigateur neuve pour vérifier le comportement livré. [Version en production](https://skyjo-scoring-production.up.railway.app/api/version)

À savoir pour la PWA : changer une icône impose de **changer son adresse** (`?v=…`), sinon Android ne la met pas à jour
(détails dans [docs/SERVEUR.md](docs/SERVEUR.md#pwa-manifeste-icônes-et-mises-à-jour)).
