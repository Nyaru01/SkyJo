# Audit de Sécurité et Plan d'Action - SkyJo

Ce document centralise l'audit de sécurité réalisé sur le projet SkyJo ainsi que le plan d'action pour corriger les failles identifiées.

---

## 1. Rapport d'Audit de Sécurité

### Résumé des Vulnérabilités

| Gravité | Type | Description |
| :--- | :--- | :--- |
| 🔴 CRITIQUE | Impersonation | Le système fait confiance au `dbId` fourni par le client. N'importe qui peut se faire passer pour n'importe quel joueur en connaissant son ID. |
| 🔴 CRITIQUE | Accès non autorisé (API) | Les endpoints `/api/social/profile` et `/api/social/migrate` permettent de modifier n'importe quel profil sans vérification d'identité. |
| 🟡 ÉLEVÉE | Fuite d'informations | L'endpoint `/api/config/version` expose des variables d'environnement sensibles (Firebase keys, etc.). |
| 🟡 MOYENNE | CORS Permissif | L'API accepte des requêtes de n'importe quel domaine (`origin: "*"`), facilitant les attaques de type CSRF ou l'exploitation par des sites tiers. |
| 🔵 FAIBLE | Absence de JWT/Session | L'état civil du joueur n'est pas sécurisé par un jeton d'authentification standard. |

### Détails Techniques

#### A. Faille d'Impersonation (Auth Bypass)
Le serveur utilise `dbId` envoyé dans le corps des requêtes POST ou dans les événements Socket.io pour identifier le joueur.
**Risque** : Un attaquant peut usurper le compte d'un autre joueur (changer son pseudo, voler son XP, supprimer ses amis) simplement en envoyant une requête avec l'ID de la victime.

#### B. Fuite de Configuration
L'endpoint de diagnostic `/api/config/version` renvoie des informations sur la présence et la validité des clés privées Firebase.
**Risque** : Aide un attaquant à cartographier l'infrastructure et expose potentiellement des vecteurs d'attaque sur les services tiers.

#### C. API Sociale non sécurisée
Toutes les actions sociales (amis, profils, recherche) sont ouvertes. Un script malveillant pourrait scraper l'intégralité de la base d'utilisateurs ou spammer des demandes d'amis massives.

---

## 2. Plan d'Action : Sécurisation et Authentification

### Analyse des Risques

> [!WARNING]
> **Risques de Casse et de Progression**
> - **Mode en Ligne** : Si le jeton (JWT) n'est pas correctement transmis ou validé, les joueurs ne pourront plus rejoindre de salon.
> - **Progression** : Le risque principal est qu'un joueur ne puisse plus s'associer à son ancien `dbId`, ce qui donnerait l'impression d'une remise à zéro du niveau.
> - **Incompatibilité** : Les versions non mises à jour de l'application (anciennes caches navigateurs) pourraient être rejetées par le nouveau serveur sécurisé.

**Stratégies d'atténuation :**
- **Migration en douceur** : Permettre une période de transition où le jeton est optionnel ou généré automatiquement à partir de l'ID existant.
- **Sauvegarde avant modification** : Validation stricte des données avant toute écriture en base.
- **Tests de non-régression** : Vérifier que le flux "Connexion -> Jeu -> Score" fonctionne toujours de bout en bout.

### Changements Proposés

#### Serveur (`server/`)
- **`index.js`** :
    - Mise en place de secrets pour la signature des jetons (JWT).
    - Sécurisation des routes `/api/social/profile` et `/api/social/migrate`.
    - Nettoyage de l'API `/api/config/version` pour masquer les clés privées.
    - Restriction des accès CORS aux domaines autorisés.
- **`middleware/auth.js` (NOUVEAU)** :
    - Création d'un middleware pour valider les jetons sur les requêtes HTTP et les connexions Socket.io.

#### Client (`src/`)
- **`store/onlineGameStore.js`** :
    - Gestion du stockage local du jeton.
    - Ajout du jeton dans les headers de l'API et dans les données d'authentification Socket.io.

### Plan de Vérification
1. Vérifier qu'un utilisateur ne peut plus modifier le profil d'un autre joueur via un script.
2. Tester le cycle de vie complet d'une partie en ligne avec les nouvelles sécurités.
3. Confirmer que les anciennes progressions sont bien conservées et accessibles.
