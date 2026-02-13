# Récapitulatif Système de Notifications Push (v1.2.2)

Ce document récapitule les problèmes identifiés et les solutions apportées au système de notifications FCM (Firebase Cloud Messaging).

## 1. Comptes & Appareils
L'investigation a révélé l'existence de deux comptes distincts, ce qui créait une confusion dans la base de données :

| Utilisateur | Appareil | ID Utilisateur | État Initial |
| :--- | :--- | :--- | :--- |
| **Virgil RoG** | PC | `u-1769629092051-hxn2y43js` | ✅ Token OK |
| **Virgil** | Smartphone | `u-1769612875523-a2h4z6niq` | ❌ Aucun token |

## 2. Le Bug Identifié
Le problème n'était pas un bug de Firebase, mais une **collision de cache local** (localStorage) :

- L'application utilisait une clé générique `fcm_token_verified` pour savoir si le token avait été envoyé au serveur.
- Quand vous passiez du compte **Virgil RoG** au compte **Virgil** sur le même navigateur (ou via synchronisation de profil Chrome), le smartphone de Virgil voyait que le flag était déjà à "vrai" (car envoyé par le compte RoG).
- Résultat : Le compte **Virgil** (Smartphone) n'envoyait jamais son token au serveur, restant ainsi en état "No subscription".

## 3. Solutions Appliquées (v1.2.2)

### ✅ Isolation des Comptes (Client-side)
La clé de vérification est maintenant unique par utilisateur :
`fcm_token_verified_[USER_ID]`
Cela garantit que chaque compte enregistré sur un même appareil enverra bien son propre token au serveur.

### ✅ Force Refresh Global
Le système de version (`FORCE_REFRESH_VER`) a été passé en `v1.2.2`. 
Cela force tous les clients (y compris le smartphone) à :
1. Supprimer l'ancien token potentiellement corrompu.
2. Générer un nouveau token FCM.
3. Le renvoyer au serveur avec les nouveaux paramètres de sécurité.

### ✅ Traçabilité des Désabonnements
L'API `/api/push/unsubscribe` accepte maintenant un paramètre `reason`. 
Si un appareil se désabonne de lui-même, les logs Railway afficheront désormais la cause exacte (ex: `pushManager_legacy` ou `usePushNotifications_manual`).

## 4. Procédure de Vérification
Pour confirmer que tout est rentré dans l'ordre sur le smartphone :

1. Accéder à l'app sur le smartphone.
2. Vérifier dans la console (si possible) ou attendre le message : `✅ FCM Token sent to server successfully`.
3. Sur Railway, chercher le log : `[SUBS] User: Virgil (u-1769612875523-a2h4z6niq) | ...`.
4. Tester une invitation : le fallback FCM devrait maintenant trouver un token pour l'ID `u-1769612875523...`.

---
*Dernière mise à jour : 13/02/2026 - Version de l'application : 1.2.2-fcm-multi-account*
