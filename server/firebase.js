import admin from 'firebase-admin';

let firebaseApp = null;

export const initFirebase = () => {
    // Si déjà initialisé, on retourne l'instance
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
        try {
            if (typeof privateKey === 'string') {
                // 1. Enlever les guillemets éventuels (Railway / .env)
                privateKey = privateKey.trim().replace(/^["']|["']$/g, '');

                // 2. Gérer les \n littéraux (fréquent dans les variables d'env)
                if (privateKey.includes('\\n')) {
                    privateKey = privateKey.replace(/\\n/g, '\n');
                }

                // 3. Normalisation finale : s'assurer des headers/footers propres
                // (Si la clé est sur une seule ligne avec des espaces, on tente de la ré-indenter)
                if (!privateKey.includes('\n') && privateKey.includes('-----')) {
                    privateKey = privateKey.replace(/-----BEGIN PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----\n')
                        .replace(/-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----');
                }

                console.log(`[FIREBASE_DIAG] Private key normalization complete. Length: ${privateKey.length}`);
            }

            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            console.log('✅ [FIREBASE] Admin initialized successfully for project:', projectId);
            return firebaseApp;
        } catch (error) {
            console.error('❌ [FIREBASE] Initialization error catch block:', error.message);
            if (error.stack) console.error(error.stack);
        }
    } else {
        const missing = [];
        if (!projectId) missing.push('FIREBASE_PROJECT_ID');
        if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
        if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
        console.warn('⚠️ [FIREBASE] Missing environment variables:', missing.join(', '));
    }
    return null;
};

export const getFirebaseAdmin = () => {
    if (admin.apps.length > 0) return admin.app();
    return initFirebase();
};

export default { initFirebase, getFirebaseAdmin };
