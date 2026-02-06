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

function App() {
  const [showIntro, setShowIntro] = useState(() => {
    // Skip intro if we are invited to a room
    const params = new URLSearchParams(window.location.search);
    return !params.has('room');
  });

  // Handle Deep Links Global Listener
  useEffect(() => {
    const handleSWMessage = (event) => {
      if (event.data?.type === 'DEEP_LINK') {
        console.log('🚀 [APP] Received DEEP_LINK:', event.data.url);
        // Force update URL so Dashboard can read it when it mounts
        if (event.data.url) {
          window.history.replaceState({}, document.title, event.data.url);
        }
        setShowIntro(false);
      }
    };

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
                toastOptions={{
                  className: '!bg-slate-900/95 !backdrop-blur-xl !border !border-white/10 !text-white !rounded-2xl !shadow-2xl',
                  style: {
                    background: 'rgba(15, 23, 42, 0.95)',
                    color: '#fff',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '20px',
                    padding: '16px 24px', // Bigger padding
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    fontSize: '16px', // Bigger font
                    fontWeight: '700',
                    letterSpacing: '0.025em',
                    maxWidth: '500px', // Wider
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: 'white',
                    },
                    style: {
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      background: 'rgba(6, 78, 59, 0.9)', // Slight tint for success
                    }
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: 'white',
                    },
                    style: {
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      background: 'rgba(127, 29, 29, 0.9)', // Slight tint for error
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
