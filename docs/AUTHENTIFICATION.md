# Vesper — identité des joueurs et compte Google

Vesper fonctionne **sans compte obligatoire**. Chaque joueur a une identité locale, et peut la lier à son compte Google
pour la retrouver sur un autre appareil. Google sert uniquement à **prouver qui est le joueur** au moment de la liaison
ou de la restauration ; le jeu ne demande pas de connexion à chaque visite.

## 1. Les identifiants d'un joueur

| Identifiant | Exemple | Créé où | Rôle |
| --- | --- | --- | --- |
| `userProfile.id` | `u-1794818314895-qnov4ja5i` | Navigateur, au premier lancement (`src/store/gameStore.js`) | Clé du profil en base (`users.id`) |
| Vesper ID (`vibeId`) | `#MR1BY1` | Navigateur (`generateSkyId`), puis enregistré en base (`users.vibe_id`) | Identifiant public, partagé pour ajouter des amis |
| `firebase_uid` | identifiant Firebase | Après connexion Google (`users.firebase_uid`, unique) | Lien vers le compte Google |

Le profil (pseudo, avatar, niveau, XP, défis) vit dans le stockage local du navigateur et est **recopié sur le serveur**
(`POST /api/social/profile`, logique dans `src/lib/profileSync.js`). Au lancement, le jeu relit la version du serveur
(`GET /api/social/profile/:id`) et fusionne les deux.

Sans compte Google lié, tout repose sur `userProfile.id` stocké dans le navigateur : vider les données du site,
changer de navigateur ou d'appareil fait repartir d'un nouveau profil.

## 2. Liaison avec Google

Côté navigateur : `src/lib/firebase.js` (SDK Firebase, `GoogleAuthProvider`) et `src/components/SocialMenu.jsx`.
Côté serveur : `POST /api/auth/google-link` dans `server/index.js`, avec Firebase Admin (`server/firebase.js`).

1. Dans **Social › Profil**, le joueur touche **« Lier Google »**, ou **« Restaurer »** dans la section Sauvegarde.
2. Une fenêtre Google s'ouvre (`signInWithPopup`). Firebase renvoie un **jeton d'identité** signé par Google.
3. Le navigateur envoie au serveur `{ idToken, dbId: userProfile.id }`.
4. Le serveur **vérifie le jeton** avec Firebase Admin (`verifyIdToken`), ce qui donne un `firebase_uid` fiable.
5. Selon la base :
   - **aucun profil n'a ce `firebase_uid`** : il est attaché au profil actuel → réponse `linked_success` ;
   - **le profil actuel l'a déjà** → `already_linked` ;
   - **un autre profil l'a** → `conflict`, avec ce profil (`existingUser` : nom, niveau, XP, Vesper ID, avatar).
6. En cas de conflit, le joueur choisit :
   - **Restaurer** l'ancien profil : le jeu remplace son profil local par celui du serveur (`forceRestoreProfile`,
     puis `loadProfileFromBackend`). C'est le parcours « changer de téléphone » ;
   - **Lier quand même** le profil actuel : nouvel appel avec `force: true`. Le serveur détache le Google de l'ancien
     profil et l'attache au profil actuel.

Le badge « Compte Google lié » s'affiche ensuite dans la section Sauvegarde (`isLinked`).

## 3. Configuration

### Console Firebase

- **Authentication › Méthodes de connexion** : fournisseur **Google** activé.
- **Authentication › Paramètres › Domaines autorisés** : `skyjo-scoring-production.up.railway.app` (et `localhost`
  pour le développement). Tout nouveau domaine doit y être ajouté, sinon la fenêtre Google refuse de s'ouvrir.
- **Paramètres du projet › Vos applications** : les valeurs de l'application web → variables `VITE_FIREBASE_*`.
- **Paramètres du projet › Comptes de service** : « Générer une nouvelle clé privée » → `FIREBASE_CLIENT_EMAIL` et
  `FIREBASE_PRIVATE_KEY`.

### Variables d'environnement

| Variable | Où | Secret ? |
| --- | --- | --- |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID` | Intégrées au build du navigateur | Non (publiques par nature, la sécurité repose sur les domaines autorisés) |
| `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Serveur uniquement (`.env` local, variables Railway) | **Oui** |
| `FIREBASE_PROJECT_ID` | Serveur (facultatif, sinon `VITE_FIREBASE_PROJECT_ID`) | Non |

`FIREBASE_PRIVATE_KEY` peut être collée avec des `\n` littéraux ou entre guillemets : `server/firebase.js` la
normalise. Si une variable manque, le serveur le signale au démarrage (`[FIREBASE] Missing environment variables`) et
`/api/auth/google-link` répond « Server authentication unconfigured ».

## 4. Limites connues (sécurité)

La liaison Google est vérifiée, mais **le reste de l'API fait confiance à l'identifiant envoyé par le navigateur** :

- `POST /api/social/profile` accepte n'importe quel `id` : connaître l'identifiant local d'un joueur suffit pour
  modifier son profil.
- Les actions sociales et les événements Socket.io identifient le joueur par l'ID qu'il annonce.
- `POST /api/auth/google-link` avec `force: true` attache un compte Google au profil désigné par `dbId` : il faut
  posséder le compte Google, mais pas prouver qu'on possède ce profil.
- CORS est ouvert à toutes les origines (`cors()` et Socket.io `origin: "*"`).

La correction de fond consiste à faire de Google, ou d'un jeton de session émis par le serveur, la preuve d'identité
de chaque requête. Plan détaillé : [security_plan.md](security_plan.md).

## 5. Dépannage

| Symptôme | Piste |
| --- | --- |
| « Erreur de connexion Google » dès l'ouverture | Domaine absent des domaines autorisés Firebase ; fenêtre bloquée par le navigateur |
| « Server authentication unconfigured » | `FIREBASE_CLIENT_EMAIL` ou `FIREBASE_PRIVATE_KEY` absente sur Railway |
| Erreur 401 « Authentication failed » | Clé privée invalide ou révoquée ; jeton d'un autre projet Firebase (variables `VITE_` et serveur incohérentes) |
| Profil « perdu » après changement d'appareil | Le joueur n'avait pas lié Google ; sinon « Restaurer » depuis le nouvel appareil |
