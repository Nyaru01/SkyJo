import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { messaging } from '../lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';

// Récupérer la clé publique VAPID pour Firebase
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export const usePushNotifications = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState('default');

    const userProfile = useGameStore(state => state.userProfile);

    useEffect(() => {
        // Log initializing every time to track in console
        console.log('[FCM] Push Hook Init - Permission:', Notification.permission, 'User:', userProfile?.id);

        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);

            // Auto-subscription if permission is already granted
            // This ensures migration from Web-Push to FCM is seamless
            if (Notification.permission === 'granted' && userProfile?.id) {
                console.log('[FCM] Permission granted & User loggé. Migration/Vérification en cours...');
                subscribe().then(token => {
                    if (token) console.log('[FCM] Auto-migration/verification successful');
                    else console.log('[FCM] Auto-migration/verification did not return a token');
                });
            } else if (Notification.permission === 'granted') {
                console.log('[FCM] En attente du chargement du profil utilisateur pour migration...');
            } else {
                console.log('[FCM] Notifications bloquées ou non autorisées:', Notification.permission);
                checkSubscription();
            }

            // Écouter les messages quand l'app est au premier plan
            const unsubscribeOnMessage = onMessage(messaging, (payload) => {
                console.log('[FCM] Foreground message:', payload);
            });

            return () => unsubscribeOnMessage();
        } else {
            console.error('[FCM] Push not supported');
        }
    }, [messaging, userProfile?.id, Notification.permission]);

    const checkSubscription = async () => {
        try {
            // Dans FCM, on vérifie si on a un token en local storage ou via getToken
            // Mais pour l'UI, on se base sur la permission et si on a déjà envoyé au serveur
            const registration = await navigator.serviceWorker.ready;
            const currentToken = await getToken(messaging, {
                serviceWorkerRegistration: registration,
                vapidKey: VAPID_PUBLIC_KEY
            });
            setIsSubscribed(!!currentToken);
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    };

    const requestPermission = async () => {
        if (!isSupported) return false;

        try {
            const permission = await Notification.requestPermission();
            setPermission(permission);

            if (permission === 'granted') {
                await subscribe();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error requesting permission:', error);
            return false;
        }
    };

    const subscribe = async () => {
        // Check browser support directly to avoid race condition with React state
        const browserSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        if (!browserSupported || Notification.permission !== 'granted') {
            console.log('[FCM] Cannot subscribe: browser support:', browserSupported, 'permission:', Notification.permission);
            return null;
        }

        try {
            console.log('[FCM] Beginning subscription process for:', userProfile?.id);
            const registration = await navigator.serviceWorker.ready;

            // Force an update check to be sure we have the latest SW
            await registration.update();

            const token = await getToken(messaging, {
                serviceWorkerRegistration: registration,
                vapidKey: VAPID_PUBLIC_KEY
            });

            if (token) {
                console.log('✅ FCM Token generated:', token);

                // Envoyer le token au serveur
                const response = await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token,
                        userId: userProfile?.id,
                        username: userProfile?.name,
                    })
                });

                if (response.ok) {
                    console.log('✅ FCM Token sent to server successfully');
                    setIsSubscribed(true);
                } else {
                    console.error('❌ Failed to send FCM token to server');
                }
                return token;
            } else {
                console.warn('[FCM] No token returned from getToken()');
            }
        } catch (error) {
            console.error('❌ [FCM] Error subscribing to FCM:', error);
            return null;
        }
    };

    const unsubscribe = async () => {
        // FCM ne permet pas de "se désabonner" facilement via le SDK client sans supprimer le token
        // On informe surtout le serveur de supprimer ce token pour cet utilisateur
        try {
            if (userProfile?.id) {
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: userProfile.id })
                });
            }
            setIsSubscribed(false);
            console.log('✅ Unsubscribed from FCM (server-side)');
        } catch (error) {
            console.error('Error unsubscribing:', error);
        }
    };

    return {
        isSupported,
        isSubscribed,
        permission,
        requestPermission,
        subscribe,
        unsubscribe,
    };
};
