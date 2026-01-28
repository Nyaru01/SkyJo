import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

export function VersionCheck() {
    const [serverVersion, setServerVersion] = useState(null);
    const [isOutdated, setIsOutdated] = useState(false);
    const clientVersion = __APP_VERSION__;

    useEffect(() => {
        const checkVersion = async () => {
            try {
                const res = await fetch(`/api/version?t=${Date.now()}`);
                if (!res.ok) return;
                const data = await res.json();

                // If versions differ, force update
                if (data.version && data.version !== clientVersion) {
                    setServerVersion(data.version);
                    setIsOutdated(true);

                    // Force clean SW cache
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.getRegistrations().then(function (registrations) {
                            for (let registration of registrations) {
                                registration.update();
                            }
                        });
                    }
                }
            } catch (err) {
                console.error('Version check failed:', err);
            }
        };

        // Check on mount
        checkVersion();

        // And every minute
        const interval = setInterval(checkVersion, 60000);
        return () => clearInterval(interval);
    }, [clientVersion]);

    if (!isOutdated) return null;

    const handleUpdate = () => {
        // Unregister SW to force fresh assets
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                for (let registration of registrations) {
                    registration.unregister();
                }
            }).then(() => {
                window.location.reload(true);
            });
        } else {
            window.location.reload(true);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center animate-bounce">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-white uppercase tracking-wider">Mise à jour requise</h2>
                        <p className="text-slate-400 text-sm">
                            Une nouvelle version est disponible !<br />
                            Pour corriger les icônes et problèmes d'affichage, une mise à jour est nécessaire.
                        </p>
                        <div className="flex items-center justify-center gap-4 text-xs font-mono bg-black/20 py-2 rounded-lg mt-2">
                            <span className="text-red-400">v{clientVersion}</span>
                            <span className="text-slate-600">➜</span>
                            <span className="text-emerald-400">v{serverVersion}</span>
                        </div>
                    </div>

                    <Button
                        onClick={handleUpdate}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 shadow-lg hover:shadow-red-500/25 transition-all"
                    >
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin-slow" />
                        Mettre à jour maintenant
                    </Button>
                </div>
            </div>
        </div>
    );
}
