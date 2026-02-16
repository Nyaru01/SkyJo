import { getFirebaseAdmin } from '../firebase.js';

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

        // Extraction robuste du token (gère les objets JSON stringifiés ou bruts)
        let subscriptionData = result.rows[0].subscription;
        let token;

        if (typeof subscriptionData === 'string') {
            try {
                // Tenter de parser si c'est une string JSON
                const parsed = JSON.parse(subscriptionData);
                token = parsed.token || parsed; // Gère {token: "..."} ou juste le token
            } catch (e) {
                // Si le parse échoue, c'est probablement le token brut
                token = subscriptionData;
            }
        } else if (typeof subscriptionData === 'object') {
            token = subscriptionData.token || null;
            if (!token && subscriptionData.endpoint) {
                console.warn(`[FCM] User ${invitedUserId} has an old Web Push subscription. Migration needed.`);
                return { success: false, reason: 'Old Web Push format' };
            }
        }

        if (!token || typeof token !== 'string') {
            console.error(`[FCM] Invalid token for user ${invitedUserId}:`, subscriptionData);
            return { success: false, reason: 'Invalid token' };
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
                ttl: 3600 * 1000, // Expire après 1h si non délivré (pertinent pour un jeu)
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
            console.log(`[FCM] Token invalid or mismatched for user ${invitedUserId} (${error.code}), removing...`);
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
