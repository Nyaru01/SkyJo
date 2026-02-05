// public/sw.js - Push Notifications Service Worker

// Écouter les push notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received:', event);

    // Parser les données envoyées par le serveur
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            console.warn('[SW] Error parsing push data:', e);
            data = { body: event.data.text() };
        }
    }

    const title = data.title || '🎮 Skyjo Score';
    const options = {
        body: data.body || 'Nouvelle notification',
        icon: '/pwa-192-v5.png',
        badge: '/badge-72.png',
        image: data.image, // Image optionnelle
        data: {
            url: data.url || '/',
            action: data.action,
            invitationId: data.invitationId,
            roomId: data.roomId,
        },
        actions: [
            {
                action: 'accept',
                title: '✅ Rejoindre',
                icon: '/icons/accept.png' // optionnel
            },
            {
                action: 'decline',
                title: '❌ Ignorer',
                icon: '/icons/decline.png' // optionnel
            }
        ],
        tag: data.tag || 'default', // Évite les doublons
        requireInteraction: true, // Reste jusqu'à ce qu'on agisse (Android)
        vibrate: [200, 100, 200], // Pattern de vibration
        sound: '/sounds/notification.mp3' // Son (Android)
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Gérer les clics sur la notification
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);

    event.notification.close();

    const action = event.action;
    const data = event.notification.data || {};
    const urlToOpen = data.url || `/?room=${data.roomId}`;

    // Action simple : on ouvre ou on focus la fenêtre
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((windowClients) => {
            // Si une fenêtre est déjà ouverte, utiliser postMessage pour éviter le reload
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    // Envoyer le deep-link via postMessage au lieu de navigate()
                    client.postMessage({ type: 'DEEP_LINK', url: urlToOpen });
                    return client.focus();
                }
            }
            // Sinon on ouvre une nouvelle fenêtre
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );

    // Gérer les actions de boutons (optionnel si on veut faire des trucs précis)
    if (action === 'accept') {
        if (data.invitationId) {
            fetch('/api/invitations/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invitationId: data.invitationId })
            }).catch(err => console.error('[SW] API Error:', err));
        }
    } else if (action === 'decline') {
        if (data.invitationId) {
            fetch('/api/invitations/decline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invitationId: data.invitationId })
            }).catch(err => console.error('[SW] API Error:', err));
        }
    }
});

// Gérer la fermeture de la notification
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed:', event);
});
