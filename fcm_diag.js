
import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

let projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
let senderId = process.env.VITE_FIREBASE_SENDER_ID;

console.log('--- FCM DIAGNOSTIC (ROBUST) ---');
console.log('Project ID:', projectId);
console.log('Client Email:', clientEmail);
console.log('Sender ID (Config):', senderId);

async function run() {
    try {
        if (!privateKey || !clientEmail || !projectId) {
            console.error('Missing credentials in .env');
            return;
        }

        // Nettoyage PEM identique au serveur
        if (typeof privateKey === 'string') {
            privateKey = privateKey.trim();
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                privateKey = privateKey.substring(1, privateKey.length - 1);
            }
            let body = privateKey
                .replace('-----BEGIN PRIVATE KEY-----', '')
                .replace('-----END PRIVATE KEY-----', '')
                .replace(/\\n/g, '')
                .replace(/\s/g, '');
            privateKey = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`;
        }

        const app = admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });

        console.log('✅ Firebase Admin initialized successfully');
        console.log('App Options Project ID:', app.options?.credential?.projectId || 'Not in options');

        // Tester l'accès au messaging
        const messaging = admin.messaging(app);
        console.log('✅ Messaging service acquired');

    } catch (err) {
        console.error('❌ Diagnostic failed:', err.message);
        if (err.stack) console.error(err.stack);
    } finally {
        process.exit();
    }
}

run();
