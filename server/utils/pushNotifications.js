import webpush from 'web-push';
import pool from '../db.js';
import dotenv from 'dotenv';
dotenv.config();

// Configurer web-push avec vos clés VAPID
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('⚠️ VAPID keys are missing! Push notifications will not work.');
}

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:contact@skyjo-score.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

export async function sendInvitationNotification(inviterId, inviterName, invitedUserId, roomId) {
    try {
        console.log(`[PUSH] Attempting to notify ${invitedUserId} invited by ${inviterName}`);

        // Récupérer la subscription du joueur invité
        const result = await pool.query(
            'SELECT subscription FROM push_subscriptions WHERE user_id = $1',
            [invitedUserId]
        );

        if (result.rows.length === 0) {
            console.log(`[PUSH] No subscription found for user: ${invitedUserId}`);
            return { success: false, reason: 'No subscription' };
        }

        const subscription = result.rows[0].subscription; // Already JSONB, so it's an object

        // Créer le payload de notification
        const payload = JSON.stringify({
            title: '🎮 Nouvelle Invitation',
            body: `${inviterName} vous invite à jouer !`,
            icon: '/pwa-192-v5.png',
            badge: '/badge-72.png',
            url: `/?room=${roomId}`,
            action: 'game-invitation',
            invitationId: `${inviterId}-${Date.now()}`,
            roomId: roomId,
            tag: `invitation-${roomId}`, // Évite les doublons
            sentAt: Date.now(), // Métrique : Moment de l'envoi
        });

        // Envoyer la notification avec options d'optimisation
        try {
            const start = Date.now();
            const response = await webpush.sendNotification(subscription, payload, {
                TTL: 3600, // 1 heure (en secondes)
                urgency: 'high', // Priorité haute pour réveiller le mobile
            });
            const duration = Date.now() - start;
            console.log(`✅ [PUSH] Notification sent to user: ${invitedUserId} in ${duration}ms`);
            return { success: true, response, duration };
        } catch (sendError) {
            // Gérer les erreurs spécifiques de web-push
            if (sendError.statusCode === 410) {
                console.log(`[PUSH] Subscription expired/invalid for user ${invitedUserId}, removing...`);
                await pool.query(
                    'DELETE FROM push_subscriptions WHERE user_id = $1',
                    [invitedUserId]
                );
            } else {
                throw sendError;
            }
            return { success: false, error: sendError.message };
        }

    } catch (error) {
        console.error('[PUSH] Error sending push notification:', error);
        return { success: false, error: error.message };
    }
}

// Envoyer à plusieurs utilisateurs
export async function sendBulkNotifications(userIds, payload) {
    // TODO: Implémenter si nécessaire pour des diffusions générales
    console.log('Bulk notifications not yet implemented');
    return { successful: 0 };
}
