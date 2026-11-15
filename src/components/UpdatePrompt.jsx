import { useEffect, useState, useCallback, createContext, useContext, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import '../styles/Guide.css';

/* global __APP_VERSION__ */

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
    // Version annoncée par le serveur : seconde source de détection (WebAPK qui ratent le SW).
    // Les deux sources alimentent désormais une seule et même fenêtre.
    const [serverVersion, setServerVersion] = useState(null);
    const [dismissed, setDismissed] = useState(false);

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

    // Interroge le serveur au lancement puis chaque minute.
    useEffect(() => {
        const clientVersion = __APP_VERSION__;
        const checkVersion = async () => {
            try {
                const res = await fetch(`/api/config/version?t=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
                if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) return;
                const data = await res.json();
                if (data.version && data.version !== clientVersion) {
                    setServerVersion(data.version);
                    navigator.serviceWorker?.getRegistrations?.().then(regs => regs.forEach(r => r.update())).catch(() => {});
                }
            } catch { /* hors ligne : on réessaiera */ }
        };
        checkVersion();
        const id = window.setInterval(checkVersion, 60000);
        return () => window.clearInterval(id);
    }, []);

    const handleDismiss = () => {
        if (isUpdating) return;
        setShowPrompt(false);
        setNeedRefresh(false);
        setDismissed(true);
    };
    const visible = !dismissed && (showPrompt || Boolean(serverVersion));

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
            {/* Une seule fenêtre de mise à jour, au style crépuscule */}
            <AnimatePresence>
                {visible && (
                    <Motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        transition={{ duration: 0.32, ease: [0.2, 0.8, 0.25, 1] }}
                        className="skyjo-update"
                        role="status"
                        aria-live="polite"
                    >
                        <span className="skyjo-update-icon" aria-hidden="true">
                            <RefreshCw size={18} strokeWidth={1.8} className={isUpdating ? 'animate-spin' : undefined} />
                        </span>
                        <span className="skyjo-update-copy">
                            <strong>{isUpdating ? 'Installation…' : updateError ? 'Échec de la mise à jour' : 'Nouvelle version prête'}</strong>
                            <small>
                                {updateError || (isUpdating
                                    ? 'Vesper redémarre dans un instant.'
                                    : serverVersion ? `v${__APP_VERSION__} → v${serverVersion}` : 'Quelques secondes pour l’installer.')}
                            </small>
                        </span>
                        <button type="button" onClick={applyUpdate} disabled={isUpdating} className="skyjo-update-apply">
                            {updateError ? 'Réessayer' : 'Installer'}
                        </button>
                        <button type="button" onClick={handleDismiss} disabled={isUpdating} aria-label="Plus tard" className="skyjo-update-close">
                            <X size={16} aria-hidden="true" />
                        </button>
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
