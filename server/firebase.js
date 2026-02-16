import admin from 'firebase-admin';

let firebaseApp = null;

export const initFirebase = () => {
    // Si déjà initialisé, on retourne l'instance
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
        try {
            // Nettoyage FLEXIBLE pour Railway / Windows / Docker
            if (typeof privateKey === 'string') {
                privateKey = privateKey.trim();

                // 1. Enlever les guillemets éventuels
                if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                    privateKey = privateKey.substring(1, privateKey.length - 1);
                }

                // 2. Extraire le corps Base64 proprement via Regex
                const headerRegex = /-----BEGIN [A-Z ]*PRIVATE KEY-----/;
                const footerRegex = /-----END [A-Z ]*PRIVATE KEY-----/;

                const headerMatch = privateKey.match(headerRegex);
                const footerMatch = privateKey.match(footerRegex);

                if (headerMatch && footerMatch) {
                    const headerStr = headerMatch[0];
                    const footerStr = footerMatch[0];
                    const startPos = headerMatch.index + headerStr.length;
                    const endPos = footerMatch.index;

                    let body = privateKey.substring(startPos, endPos);
                    // Nettoyer le corps : garder uniquement Base64 (A-Z, a-z, 0-9, +, /, =)
                    body = body.replace(/[^A-Za-z0-9+/=]/g, '');

                    // Reconstruire PEM (Node.js accepte le corps sur une seule ligne)
                    privateKey = `${headerStr}\n${body}\n${footerStr}\n`;
                } else {
                    // Fallback si format bizarre : conversion simple \n
                    privateKey = privateKey.replace(/\\n/g, '\n');
                }

                console.log(`[FIREBASE_DIAG] Final PEM format length: ${privateKey.length}`);
            }

            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            console.log('✅ [FIREBASE] Admin initialized successfully');
            return firebaseApp;
        } catch (error) {
            console.error('❌ [FIREBASE] Initialization error:', error.message);
        }
    } else {
        console.warn('⚠️ [FIREBASE] Missing environment variables for Admin SDK');
    }
    return null;
};

export const getFirebaseAdmin = () => {
    if (admin.apps.length > 0) return admin.app();
    return initFirebase();
};

export default { initFirebase, getFirebaseAdmin };
