# Vesper

Jeu de cartes inspiré du Skyjo, en application web installable (PWA) : contre l'IA, en ligne entre amis, avec des modes
spéciaux (Tourment, Fury), une carrière, des défis et un classement. Anciennement « Skyjo Score ».

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
| `docs/reference/` | Règles officielles du Skyjo (texte et PDF) |
| `docs/archive/` | Anciens rapports, notes et candidats de logo (historique, plus maintenu) |

## Démarrer en local

Prérequis : Node.js 20 ou plus (le serveur de production tourne en Node 20).

```bash
npm ci
```

```bash
cp .env.example .env
```

Remplissez `.env` (voir [docs/SERVEUR.md](docs/SERVEUR.md#variables-denvironnement)). Il faut au minimum `DATABASE_URL`.
Sans base locale, utilisez l'URL **publique** de la base Railway : vous travaillez alors sur les données de production.

```bash
npm run dev
```

- Front (Vite) : http://localhost:5173 ; il relaie `/api` et `/socket.io` vers le serveur.
- Serveur (Express + Socket.io) : port 3000, relancé automatiquement à chaque modification (`node --watch`).

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

Un push sur `master` déclenche le déploiement Railway (build Nixpacks : `npm ci`, `npm run build`, `npm start`).

1. Augmentez la version : `npm version patch --no-git-tag-version` (la version s'affiche dans le jeu et sert au contrôle des mises à jour).
2. Message de commit au format `vX.Y.Z — résumé des changements`.
3. `git push origin master`, puis vérifiez `https://…/api/version`.

À savoir pour la PWA : changer une icône impose de **changer son adresse** (`?v=…`), sinon Android ne la met pas à jour
(détails dans [docs/SERVEUR.md](docs/SERVEUR.md#pwa-manifeste-icônes-et-mises-à-jour)).
