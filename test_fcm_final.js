import admin from 'firebase-admin';
import pool from './server/db.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Script de test officiel pour vérifier la configuration FCM
 * Usage: node test_fcm_final.js [userId]
 */

// Utilise la même logique que le serveur pour être sûr
const cleanKey = (key) => {
    if (!key) return null;
    let body = key.replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\\/g, '')
        .replace(/\s/g, '');
    return `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`;
};

async function runTest() {
    const userId = process.argv[2];

    try {
        console.log('🚀 Démarrage du test FCM...');

        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = cleanKey(process.env.FIREBASE_PRIVATE_KEY);

        if (!projectId || !clientEmail || !privateKey) {
            throw new Error('Variables d\'environnement manquantes dans .env');
        }

        const app = admin.initializeApp({
            credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        }, 'test-app-' + Date.now());

        let targetUser;
        if (userId) {
            const cleanId = userId.trim();
            console.log(`🔍 Recherche de l'utilisateur avec l'ID: "${cleanId}"`);
            const res = await pool.query('SELECT user_id, username, subscription FROM push_subscriptions WHERE user_id = $1', [cleanId]);
            targetUser = res.rows[0];

            if (!targetUser) {
                console.log(`⚠️ ID direct non trouvé, essai de recherche par nom contenant "${cleanId}"...`);
                const resName = await pool.query('SELECT user_id, username, subscription FROM push_subscriptions WHERE username ILIKE $1 LIMIT 1', [`%${cleanId}%`]);
                targetUser = resName.rows[0];
            }
        } else {
            const res = await pool.query('SELECT user_id, username, subscription FROM push_subscriptions LIMIT 1');
            targetUser = res.rows[0];
        }

        if (!targetUser) {
            console.log('❌ Aucun utilisateur avec une souscription push trouvé dans la base de données.');
            return;
        }

        console.log(`🎯 Envoi d'une notification à : ${targetUser.username} (${targetUser.user_id})`);

        let sub = targetUser.subscription;
        if (typeof sub === 'string') {
            try { sub = JSON.parse(sub); } catch (e) { }
        }
        const token = sub.token || sub;

        if (!token || typeof token !== 'string') {
            console.log('❌ Token invalide pour cet utilisateur :', sub);
            return;
        }

        const message = {
            notification: {
                title: '🧪 Test Skyjo',
                body: 'La configuration FCM fonctionne correctement !'
            },
            data: {
                url: '/',
                type: 'test'
            },
            token: token
        };

        const response = await admin.messaging(app).send(message);
        console.log('✅ Succès ! Notification envoyée avec ID:', response);
        console.log('\nVérifiez votre appareil (si vous êtes l\'utilisateur ciblé).');

    } catch (err) {
        console.error('\n❌ Erreur de test :', err.message);
        if (err.message.includes('SenderId mismatch')) {
            console.log('\n⚠️ SENDER ID MISMATCH : Le token ne correspond pas au projet Firebase.');
            console.log('Essayez de vider le cache de l\'application sur votre mobile/navigateur.');
        }
    } finally {
        await pool.end();
    }
}

runTest();
