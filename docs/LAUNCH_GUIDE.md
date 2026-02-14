# 🚀 Guide de Lancement - SkyJo

Ce document explique comment configurer et lancer le projet SkyJo (Backend et Frontend).

## 📋 Prérequis

- **Node.js** (v18 ou supérieur recommandé)
- **PostgreSQL** (pour la base de données)

## ⚙️ Configuration

1. **Installation des dépendances**
   À la racine du projet :
   ```bash
   npm install
   ```

2. **Variables d'environnement**
   Copiez le fichier d'exemple et remplissez les valeurs nécessaires :
   ```bash
   cp .env.example .env
   ```
   *Note : Assurez-vous que `DATABASE_URL` pointe vers votre instance PostgreSQL.*

## 🏃 Lancement du projet

### Méthode recommandée (Tout-en-un)
Pour lancer le serveur backend (Express/Socket.io) et le frontend (Vite) en même temps :
```bash
npm run dev
```
- **Frontend** : Accessible sur [http://localhost:5173](http://localhost:5173) (par défaut Vite)
- **Backend** : Écoute sur le port 3000 (ou celui configuré dans le `.env`)

---

### Lancement séparé

#### 🔙 Backend uniquement
```bash
# Depuis la racine
node server/index.js
# OU
npm start
```

#### 🔜 Frontend uniquement
```bash
# Depuis la racine
npx vite
```

## 🛠️ Autres commandes
- `npm run build` : Créer le build de production du frontend.
- `npm run lint` : Vérifier la qualité du code.
- `npm run preview` : Prévisualiser le build de production localement.
