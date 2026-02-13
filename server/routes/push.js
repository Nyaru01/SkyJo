import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Sauvegarder une subscription
router.post('/subscribe', async (req, res) => {
    try {
        const { subscription, token, userId, username, clientSenderId, appVersion } = req.body;
        const pushSubscription = token || subscription;

        if (!userId || !pushSubscription) {
            return res.status(400).json({ error: 'Missing userId or token/subscription' });
        }

        const tokenStr = typeof pushSubscription === 'string' ? pushSubscription : pushSubscription?.token;
        console.log(`[SUBS] User: ${username} (${userId}) | Token: ${tokenStr?.substring(0, 15)}... | ClientSenderId: ${clientSenderId || 'N/A'} | AppVer: ${appVersion || 'N/A'}`);
        console.log(`[SUBS] Server ProjectID: ${process.env.FIREBASE_PROJECT_ID} | Server SenderID: ${process.env.VITE_FIREBASE_SENDER_ID}`);

        // Sauvegarder en DB (on stocke soit le token sous forme de string, soit l'objet subscription JSON)
        await pool.query(`
      INSERT INTO push_subscriptions (user_id, username, subscription, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        subscription = $3,
        username = $2,
        updated_at = NOW()
    `, [userId, username, typeof pushSubscription === 'string' ? JSON.stringify({ token: pushSubscription }) : JSON.stringify(pushSubscription)]);

        console.log(`✅ Push subscription saved for user: ${username} (${userId})`);
        res.json({ success: true, message: 'Subscription saved' });
    } catch (error) {
        console.error('Error saving subscription:', error);
        res.status(500).json({ error: 'Failed to save subscription' });
    }
});

// Se désabonner
router.post('/unsubscribe', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        await pool.query(
            'DELETE FROM push_subscriptions WHERE user_id = $1',
            [userId]
        );

        console.log(`✅ User ${userId} unsubscribed from push`);
        res.json({ success: true, message: 'Unsubscribed' });
    } catch (error) {
        console.error('Error unsubscribing:', error);
        res.status(500).json({ error: 'Failed to unsubscribe' });
    }
});

// Tracking des notifications (réception/clic)
router.post('/track', async (req, res) => {
    try {
        const { type, userId, invitationId, sentAt, receivedAt, clickedAt } = req.body;

        const logData = {
            type,
            userId,
            invitationId,
            latency: receivedAt ? (receivedAt - sentAt) : null,
            timeToClick: clickedAt ? (clickedAt - sentAt) : null,
            timestamp: Date.now()
        };

        console.log(`📊 [METRICS] Push ${type.toUpperCase()}:`, JSON.stringify(logData));

        // Optionnel : Sauvegarder en DB si on veut des statistiques persistantes
        // await pool.query('INSERT INTO push_metrics ...');

        res.json({ success: true });
    } catch (error) {
        console.error('Error tracking push:', error);
        res.status(500).json({ error: 'Failed to track push' });
    }
});

export default router;
