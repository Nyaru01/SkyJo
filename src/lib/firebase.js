import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Configuration récupérée depuis les variables d'environnement Vite
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Initialisation de Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialisation de Firebase Messaging
export const messaging = getMessaging(app);

// Initialisation de Firestore
import { getFirestore } from "firebase/firestore";
export const db = getFirestore(app);

export default app;
