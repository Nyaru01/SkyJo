# Évolution : Portail de Connexion Persistant - SkyJo

Ce document planifie l'ajout d'un système de comptes persistants pour résoudre le problème de perte de progression lors d'un changement d'appareil ou de navigateur.

---

## 1. Contexte et Problématique

Actuellement, l'identité d'un joueur SkyJo repose sur un `dbId` généré localement et stocké dans le `localStorage` du navigateur.
- **Risque** : Si un utilisateur change de téléphone, vide son cache, ou utilise un autre navigateur, il perd son niveau (XP), ses amis et son historique.
- **Limitation** : Il n'existe aucun moyen de "lier" l'identité locale à une identité réelle et pérenne.

## 2. Objectifs du Projet

1. **Portabilité** : Permettre à un utilisateur de retrouver sa progression sur n'importe quel appareil.
2. **Unification** : Possibilité d'avoir un compte unique pour jouer sur tablette, mobile et PC.
3. **Sécurité** : Renforcer l'authentification en s'appuyant sur des fournisseurs de confiance (Google, Apple) ou un couple Email/Mot de passe sécurisé.

## 3. Solutions Envisagées

### Option A : Firebase Authentication (Recommandée)
S'appuyer sur Firebase (déjà partiellement intégré pour les notifications) pour gérer l'authentification.
- **Avantages** : Gestion simplifiée du multi-connecteur (Google, Apple, Email), SDK robuste, gestion gratuite jusqu'à un certain seuil.
- **Implémentation** : Intégration du SDK Firebase Auth côté client.

### Option B : Authentification Custom (JWT + OAuth)
Développer notre propre système s'appuyant directement sur Google Sign-In API.
- **Avantages** : Contrôle total sur les données, pas de dépendance forte à Firebase.
- **Inconvénients** : Plus complexe à sécuriser et à maintenir.

## 4. Parcours Utilisateur (UX)

### Transition "Guest" vers "Compte"
Pour ne pas frustrer les joueurs actuels, le flux doit être fluide :
1. Le joueur continue de jouer en mode "Anonyme/Local".
2. Un bouton **"Sauvegarder ma progression"** apparaît dans le profil.
3. Le joueur choisit **"Connexion avec Google"**.
4. Une fois authentifié, le `dbId` local est associé de manière permanente à l'UID Firebase/Google dans la base de données PostgreSQL.

## 5. Modifications d'Architecture

### Base de Données (PostgreSQL)
Ajout d'une colonne `auth_uid` dans la table `users` pour lier le profil à l'identité vérifiée.

### API Serveur
- Nouveau middleware de validation s'appuyant sur les jetons d'identité (ID Tokens) du fournisseur.
- Endpoint de "Merging" pour fusionner un compte anonyme avec un compte réel.

---

## 6. Prochaines Étapes Suggérées

1. **Choix du fournisseur** : Valider l'utilisation de Firebase Auth.
2. **Maquettage** : Designer l'écran de connexion (E-mail/Mot de passe et Bouton Google).
3. **Développement du module de liaison** : Créer la logique permettant de transformer un compte local en compte persistant sans perte de données.
