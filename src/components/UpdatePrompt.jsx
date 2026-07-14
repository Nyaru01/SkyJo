import { useEffect, useState, useCallback, createContext, useContext, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, CheckCircle } from 'lucide-react';

// Context to share update functions across components
const UpdateContext = createContext(null);

/**
 * UpdateProvider - Wraps the app to provide update functionality
 */
export function UpdateProvider({ children }) {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [checkResult, setCheckResult] = useState(null); // 'up-to-date' | 'update-available' | null
    const [registration, setRegistration] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState(null);
    const updateInProgressRef = useRef(false);

    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onNeedRefresh() {
            setShowPrompt(true);
            setCheckResult('update-available');
            setIsChecking(false);
        },
        onRegisteredSW(swUrl, reg) {
            console.log('[SW] Registered:', swUrl);
            setRegistration(reg);
        },
        onRegisterError(error) {
            console.error('[SW] Registration error:', error);
        },
    });

    // Keep a registration available even when the PWA hook registered before
    // React finished mounting, and periodically check for a new worker.
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return undefined;

        if (!registration) {
            navigator.serviceWorker.ready.then(setRegistration).catch((error) => {
                console.error('[SW] Unable to access registration:', error);
            });
            return undefined;
        }

        const intervalId = window.setInterval(() => registration.update(), 5 * 60 * 1000);
        return () => window.clearInterval(intervalId);
    }, [registration]);

    const waitForWaitingWorker = useCallback((reg, timeout = 12000) => new Promise((resolve) => {
        if (!reg) {
            resolve(null);
            return;
        }

        if (reg.waiting) {
            resolve(reg.waiting);
            return;
        }

        let settled = false;
        let timeoutId;
        const finish = (worker = null) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeoutId);
            resolve(worker || reg.waiting || null);
        };

        const watchWorker = (worker) => {
            if (!worker) return;
            if (worker.state === 'installed') {
                finish(reg.waiting || worker);
                return;
            }
            worker.addEventListener('statechange', () => {
                if (worker.state === 'installed') finish(reg.waiting || worker);
            });
        };

        watchWorker(reg.installing);
        reg.addEventListener('updatefound', () => watchWorker(reg.installing), { once: true });
        timeoutId = window.setTimeout(() => finish(reg.waiting), timeout);
    }), []);

    const applyUpdate = useCallback(async () => {
        if (updateInProgressRef.current) return;

        updateInProgressRef.current = true;
        setIsUpdating(true);
        setUpdateError(null);

        try {
            const reg = registration || (
                'serviceWorker' in navigator
                    ? await navigator.serviceWorker.getRegistration()
                    : null
            );

            if (!reg) {
                // Some Android WebAPK installations lose their registration
                // while continuing to display an HTTP-cached shell. A unique
                // navigation fetches the no-store index served by Express.
                const url = new URL(window.location.href);
                url.searchParams.set('force-update', Date.now().toString());
                window.location.replace(url.toString());
                return;
            }

            let hasReloaded = false;
            const reloadOnce = () => {
                if (hasReloaded) return;
                hasReloaded = true;
                window.location.reload();
            };

            navigator.serviceWorker.addEventListener('controllerchange', reloadOnce, { once: true });

            // Ask the browser to fetch the latest sw.js, then wait until it is
            // actually installed before sending SKIP_WAITING.
            await reg.update();
            const waitingWorker = await waitForWaitingWorker(reg);
            waitingWorker?.postMessage({ type: 'SKIP_WAITING' });

            // Also use Workbox's supported activation path. It reloads when the
            // new worker takes control.
            await updateServiceWorker(true);

            // Mobile WebViews occasionally miss controllerchange. Keep a safe
            // fallback so the user is never left on a frozen update button.
            window.setTimeout(reloadOnce, 6000);
        } catch (error) {
            console.error('[SW] Update failed:', error);
            setUpdateError('Impossible d’installer la mise à jour. Vérifiez votre connexion puis réessayez.');
            setIsUpdating(false);
            updateInProgressRef.current = false;
        }
    }, [registration, updateServiceWorker, waitForWaitingWorker]);

    const handleDismiss = () => {
        if (isUpdating) return;
        setShowPrompt(false);
        setNeedRefresh(false);
    };

    // Use a ref to always have the latest state of needRefresh in the manual check
    const needRefreshRef = useRef(needRefresh);
    useEffect(() => {
        needRefreshRef.current = needRefresh;
    }, [needRefresh]);

    // Manual check for updates
    const checkForUpdates = useCallback(async () => {
        if (!registration) {
            console.warn('[SW] No registration found for manual check');
            setCheckResult('up-to-date');
            setTimeout(() => setCheckResult(null), 3000);
            return;
        }

        setIsChecking(true);
        setCheckResult(null);

        try {
            console.log('[SW] Manual update check initiated');
            await registration.update();

            // Wait longer (5s) to let the SW fetch the manifest and detect differences
            // The onRegisteredSW setRefresh(true) will be triggered if an update is found
            setTimeout(() => {
                // If we are still checking (meaning onRegisteredSW didn't trigger needRefresh)
                if (!needRefreshRef.current) {
                    console.log('[SW] No update found after manual check');
                    setCheckResult('up-to-date');
                    setTimeout(() => setCheckResult(null), 3000);
                }
                setIsChecking(false);
            }, 5000);
        } catch (error) {
            console.error('[SW] Manual update check failed:', error);
            setIsChecking(false);
            setCheckResult('up-to-date');
            setTimeout(() => setCheckResult(null), 3000);
        }
    }, [registration]);

    const value = {
        checkForUpdates,
        isChecking,
        checkResult,
        needRefresh,
        applyUpdate,
        isUpdating,
        updateError,
    };

    return (
        <UpdateContext.Provider value={value}>
            {children}
            {/* Update Toast */}
            <AnimatePresence>
                {showPrompt && (
                    <Motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="fixed bottom-24 left-3 right-3 z-[200] max-w-md mx-auto"
                    >
                        <div className="surface-card relative overflow-hidden rounded-3xl p-4 sm:p-5">

                            <div className="relative flex items-start gap-4">
                                {/* Icon */}
                                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 rounded-xl shrink-0">
                                    <RefreshCw className={`w-6 h-6 text-blue-400 ${isUpdating ? 'animate-spin' : 'animate-spin-slow'}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-1">
                                    <h3 className="font-bold text-white text-base leading-none mb-1">
                                        {isUpdating ? 'Installation en cours…' : 'Mise à jour disponible'}
                                    </h3>
                                    <p className="text-slate-400 text-xs">
                                        {updateError || (isUpdating
                                            ? 'Skyjo va redémarrer automatiquement.'
                                            : 'Une nouvelle version de Skyjo est prête à être installée.')}
                                    </p>
                                </div>

                                {/* Close button */}
                                <button
                                    onClick={handleDismiss}
                                    disabled={isUpdating}
                                    aria-label="Fermer la mise à jour"
                                    className="modal-close-button premium-focus-ring -mr-1 -mt-1 shrink-0"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Action button */}
                            <button
                                onClick={applyUpdate}
                                disabled={isUpdating}
                                className="premium-focus-ring relative w-full min-h-12 mt-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    {isUpdating ? 'Mise à jour…' : updateError ? 'Réessayer' : 'Mettre à jour maintenant'}
                                </span>
                            </button>
                        </div>
                    </Motion.div>
                )}
            </AnimatePresence>
        </UpdateContext.Provider>
    );
}

/**
 * Hook to access update functions from any component
 */
// The provider and its companion hook intentionally share this module.
// eslint-disable-next-line react-refresh/only-export-components
export function useUpdateCheck() {
    const context = useContext(UpdateContext);
    if (!context) {
        // Return dummy functions if not wrapped in provider
        return {
            checkForUpdates: () => { },
            isChecking: false,
            checkResult: null,
            needRefresh: false,
            applyUpdate: () => { },
            isUpdating: false,
            updateError: null,
        };
    }
    return context;
}

// Keep default export for backwards compatibility
export default function UpdatePrompt() {
    // This is now just a wrapper, actual logic is in UpdateProvider
    return null;
}
