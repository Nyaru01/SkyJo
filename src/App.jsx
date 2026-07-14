import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard';
import ImagePreloader from './components/ui/ImagePreloader';
import ParallaxBackground from './components/ui/ParallaxBackground';
import { UpdateProvider } from './components/UpdatePrompt';
import { SocketProvider } from './components/SocketProvider';
import { VersionCheck } from './components/VersionCheck';
import { ErrorBoundary } from './components/ErrorBoundary';
import { IntroScreen } from './components/IntroScreen';

import { Toaster } from 'react-hot-toast';
import InstallPWA from './components/InstallPWA';
import MusicPlayer from './components/MusicPlayer';
import { usePushNotifications } from './hooks/usePushNotifications';

function App() {
  // Global background push notification/FCM management
  usePushNotifications();
  const [showIntro, setShowIntro] = useState(() => {
    // Skip intro if we are invited to a room
    const params = new URLSearchParams(window.location.search);
    return !params.has('room');
  });

  // Handle Deep Links Global Listener
  useEffect(() => {
    const handleSWMessage = (event) => {
      // Handle Deep Links (from internal or SW)
      if (event.data?.type === 'DEEP_LINK') {
        console.log('🚀 [APP] Received DEEP_LINK:', event.data.url);
        if (event.data.url) {
          window.history.replaceState({}, document.title, event.data.url);
        }
        setShowIntro(false);
      }


      // Handle Notification Clicks (from SW)
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        const targetUrl = event.data.url;
        console.log('📨 [APP] Message reçu du SW:', event.data);
        console.log('🚀 [APP] Navigation vers:', targetUrl);
        console.log('🚀 [APP] URL actuelle:', window.location.href);

        if (targetUrl) {
          // Force navigation to ensure fresh state/room load
          window.location.href = targetUrl;
        } else {
          console.warn('⚠️ [APP] Notification clicked but NO URL provided!', event.data);
        }
      }
    };

    console.log('🎯 [APP] Écouteur de navigation installé');
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    // Initial check for 'room' param again just in case (e.g. cold start)
    const params = new URLSearchParams(window.location.search);
    if (params.has('room')) {
      console.log('🚀 [APP] Room detected in URL, skipping intro');
      setShowIntro(false);
    }

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, []);

  // Always force dark mode on mount
  // This ensures dark theme works even if localStorage has stale darkMode: false
  useEffect(() => {
    // Always add 'dark' class - this app is dark-mode only
    document.documentElement.classList.add('dark');
    console.log('🚀 [APP] App MOUNTED');
    return () => console.log('💀 [APP] App UNMOUNTED');
  }, []);

  console.log('🔄 [APP] Rendering App...');

  return (
    <ErrorBoundary>
      <AnimatePresence>
        {showIntro && <IntroScreen key="intro" onComplete={() => setShowIntro(false)} />}
      </AnimatePresence>

      {!showIntro && (
        <div>
          <UpdateProvider>
            <SocketProvider>
              <VersionCheck />
              <MusicPlayer />
              <Toaster
                position="bottom-center"
                reverseOrder={false}
                gutter={12}
                containerStyle={{
                  bottom: 40,
                  pointerEvents: 'none',
                }}
                toastOptions={{
                  icon: null,
                  duration: 3500,
                  className: 'toast-surface !pointer-events-auto',
                  style: {
                    pointerEvents: 'auto',
                  },
                  success: {
                    icon: null,
                    style: {
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                    }
                  },
                  error: {
                    icon: null,
                    style: {
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                    }
                  },
                }}
              />

              <div className="min-h-screen font-sans text-slate-900 dark:text-slate-100 selection:bg-emerald-100 dark:selection:bg-emerald-900">
                <ImagePreloader>
                  <Dashboard />
                </ImagePreloader>
              </div>
            </SocketProvider>
          </UpdateProvider>
        </div>
      )}
    </ErrorBoundary>
  );
}

export default App;
