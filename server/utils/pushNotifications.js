import admin from 'firebase-admin';
import pool from '../db.js';
import dotenv from 'dotenv';
dotenv.config();

// Initialiser Firebase Admin avec les variables d'environnement
// Initialiser Firebase Admin avec les variables d'environnement
const getFirebaseAdmin = () => {
    try {
        // ESSAYER de récupérer l'app par défaut
        try {
            return admin.app();
        } catch (e) {
            // L'app n'existe pas encore, on continue l'init
        }

        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        console.log('[FCM_INIT] Checking Env:', {
            projectId: projectId || 'MISSING',
            clientEmail: clientEmail ? 'PRESENT' : 'MISSING',
            privateKey: privateKey ? `PRESENT (len: ${privateKey.length})` : 'MISSING'
        });

        if (!privateKey || !clientEmail || !projectId) {
            console.error('[FCM_INIT] Missing credentials:', {
                projectId: !!projectId,
                clientEmail: !!clientEmail,
                privateKey: !!privateKey,
                existingApps: admin.apps.map(a => a.name)
            });
            return null;
        }

        // Nettoyage de la clé privée (RAILWAY / ENV FIX)
        if (typeof privateKey === 'string') {
            // Un nettoyage "Bulletproof" qui gère les échappements \n et les manques de sauts de ligne
            privateKey = privateKey.trim();

            // Enlever les guillemets si présents
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                privateKey = privateKey.substring(1, privateKey.length - 1);
            }

            // Extraire le corps de la clé pour reconstruire un format PEM propre
            // Cela résout les erreurs "Invalid PEM format" et "ASN.1 encoding"
            let body = privateKey
                .replace('-----BEGIN PRIVATE KEY-----', '')
                .replace('-----END PRIVATE KEY-----', '')
                .replace(/\\n/g, '') // Enlever les \n littéraux
                .replace(/\s/g, ''); // Enlever tout espace ou vrai saut de ligne existant

            privateKey = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`;
        }

        console.log(`[FCM_INIT] Final Key Check: Length=${privateKey?.length}`);

        const newApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });

        console.log('✅ Firebase Admin initialized successfully (NEW APP)');
        return newApp;
    } catch (err) {
        console.error('❌ Failed to initialize Firebase Admin:', err.message);
        return null;
    }
};

// Auto-init at load
getFirebaseAdmin();

// Cache pour éviter les doublons d'envoi (inviterId:invitedId:roomId -> timestamp)
const lastInvites = new Map();

export async function sendInvitationNotification(inviterId, inviterName, invitedUserId, roomId) {
    const inviteKey = `${inviterId}:${invitedUserId}:${roomId}`;
    const now = Date.now();

    // Si on a déjà envoyé cette notification exacte il y a moins de 10 secondes, on ignore
    if (lastInvites.has(inviteKey) && (now - lastInvites.get(inviteKey) < 10000)) {
        console.log(`[FCM] 🛡️ Duplicate suppressed for ${inviteKey}`);
        return { success: true, reason: 'Duplicate suppressed' };
    }
    lastInvites.set(inviteKey, now);

    // Nettoyage périodique du cache
    if (lastInvites.size > 1000) {
        for (const [key, timestamp] of lastInvites.entries()) {
            if (now - timestamp > 30000) lastInvites.delete(key);
        }
    }

    try {
        console.log(`[FCM] Attempting to notify ${invitedUserId} invited by ${inviterName}`);

        const app = getFirebaseAdmin();
        if (!app) {
            throw new Error("Firebase Admin not initialized (check credentials in server logs)");
        }

        // Récupérer le token FCM du joueur invité
        // Note: La table doit maintenant stocker le token FCM
        const result = await pool.query(
            'SELECT subscription FROM push_subscriptions WHERE user_id = $1',
            [invitedUserId]
        );

        if (result.rows.length === 0) {
            console.log(`[FCM] No token found for user: ${invitedUserId}`);
            return { success: false, reason: 'No subscription' };
        }

        // Dans la migration, on suppose que 'subscription' contient maintenant le token FCM
        // (Soit une chaîne, soit un objet JSON selon comment on l'a enregistré)
        let token = result.rows[0].subscription;
        if (typeof token === 'object' && token.token) {
            token = token.token;
        } else if (typeof token === 'object' && token.endpoint) {
            // C'est un ancien abonnement Web Push, on ne peut pas l'utiliser avec FCM Admin
            console.warn(`[FCM] User ${invitedUserId} has an old Web Push subscription. Migration needed.`);
            return { success: false, reason: 'Old subscription format' };
        }

        const notificationTag = `game-invite-${roomId}-${now}`; // ✅ Tag unique par invitation

        const message = {
            data: {
                title: '🎮 Nouvelle Invitation',
                body: `${inviterName} vous invite à jouer !`,
                url: `/?room=${roomId}`,
                roomId: roomId,
                action: 'game-invitation',
                sentAt: String(now),
                invitationId: Math.random().toString(36).substring(7),
                tag: notificationTag,
                requiresInteraction: 'true'
            },
            android: {
                priority: 'high',
                ttl: 0,
                // On peut ajouter explicitement le channel pour Android ici si besoin, 
                // mais sans l'objet 'notification' pour éviter le doublon système.
            },
            webpush: {
                headers: {
                    Urgency: 'high'
                },
                fcmOptions: {
                    link: `${process.env.VITE_PUBLIC_URL || 'https://skyjo-scoring.up.railway.app'}/?room=${roomId}`
                }
            },
            token: token,
        };

        // Envoyer le message via Firebase
        const response = await admin.messaging(app).send(message);
        console.log('Successfully sent message:', response);
        return { success: true, response };

    } catch (error) {
        console.error('[FCM] Error sending message:', error);

        // Si le token est invalide, on le supprime (équivalent du 410 Gone)
        if (error.code === 'messaging/registration-token-not-registered' ||
            error.code === 'messaging/invalid-argument' ||
            error.code === 'messaging/mismatched-credential') {
            console.log(`[FCM] Token invalid for user ${invitedUserId} (${error.code}), removing...`);
            await pool.query(
                'DELETE FROM push_subscriptions WHERE user_id = $1',
                [invitedUserId]
            );
        }

        return { success: false, error: error.message };
    }
}

// Envoyer à plusieurs utilisateurs
export async function sendBulkNotifications(userIds, payload) {
    // TODO: Implémenter avec messaging().sendEach() si besoin
    return { successful: 0 };
}
