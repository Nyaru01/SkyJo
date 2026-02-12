import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Music2, Trash2, MessageSquare, ExternalLink, AlertTriangle, Smartphone, Settings, HelpCircle, Sparkles, RefreshCw, Palette, Image as ImageIcon, ChevronRight, X, Check } from 'lucide-react';
import Tutorial from './Tutorial';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Bell, BellOff } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { AboutSection } from './AboutSection';
import BonusTutorial from './BonusTutorial';
import { Swords } from 'lucide-react';

export default function SettingsPage({ onViewChangelog }) {
    const soundEnabled = useGameStore(state => state.soundEnabled);
    const musicEnabled = useGameStore(state => state.musicEnabled);
    const vibrationEnabled = useGameStore(state => state.vibrationEnabled);
    const toggleSound = useGameStore(state => state.toggleSound);
    const toggleMusic = useGameStore(state => state.toggleMusic);
    const toggleVibration = useGameStore(state => state.toggleVibration);
    const clearArchivedGames = useGameStore(state => state.clearArchivedGames);
    const background = useGameStore(state => state.background);
    const setBackground = useGameStore(state => state.setBackground);

    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const [isBonusTutorialOpen, setIsBonusTutorialOpen] = useState(false);
    const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
    const {
        isSupported,
        isSubscribed,
        permission,
        requestPermission,
        subscribe,
        unsubscribe
    } = usePushNotifications();

    const userProfile = useGameStore(state => state.userProfile);
    const setIsFeedbackOpen = useGameStore(state => state.setIsFeedbackOpen);
    const setIsAdminOpen = useGameStore(state => state.setIsAdminOpen);
    const setAdminAuthToken = useGameStore(state => state.setAdminAuthToken);

    // Initial check for push subscription
    const handleTogglePush = async () => {
        if (!isSupported) return;

        try {
            if (isSubscribed) {
                await unsubscribe();
            } else {
                if (permission === 'default') {
                    const granted = await requestPermission();
                    if (!granted) {
                        alert("⚠️ Vous avez refusé les notifications. Veuillez vérifier les paramètres de votre navigateur.");
                    }
                } else if (permission === 'denied') {
                    alert("⚠️ Notifications bloquées par le navigateur.\n\nVeuillez cliquer sur l'icône de cadenas 🔒 ou de réglages dans la barre d'adresse pour autoriser les notifications.");
                } else {
                    await subscribe();
                }
            }
        } catch (error) {
            console.error('[PUSH] Toggle Error:', error);
            alert("Erreur: " + error.message);
        }
    };

    const handleResetHistory = () => {
        clearArchivedGames();
        setShowConfirmReset(false);
    };

    const handleAdminUnlock = (token) => {
        setAdminAuthToken(token);
        setIsAdminOpen(true);
    };

    // Static styles lookup to prevent Tailwind purging and ensure valid classes
    // Static styles lookup to prevent Tailwind purging and ensure valid classes
    const TOGGLE_STYLES = {
        emerald: {
            activeBorder: "border-emerald-500/20",
            activeShadow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
            iconBgMatch: "bg-emerald-500/20 text-emerald-400",
            trackActive: "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] border border-transparent",
            dotActive: "bg-emerald-500"
        },
        sky: {
            activeBorder: "border-sky-500/20",
            activeShadow: "shadow-[0_0_15px_rgba(14,165,233,0.1)]",
            iconBgMatch: "bg-sky-500/20 text-sky-400",
            trackActive: "bg-gradient-to-r from-sky-500 to-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.5)] border border-transparent",
            dotActive: "bg-sky-500"
        },
        purple: {
            activeBorder: "border-purple-500/20",
            activeShadow: "shadow-[0_0_15px_rgba(168,85,247,0.1)]",
            iconBgMatch: "bg-purple-500/20 text-purple-400",
            trackActive: "bg-gradient-to-r from-purple-500 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)] border border-transparent",
            dotActive: "bg-purple-500"
        },
        amber: {
            activeBorder: "border-amber-500/20",
            activeShadow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]",
            iconBgMatch: "bg-amber-500/20 text-amber-400",
            trackActive: "bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)] border border-transparent",
            dotActive: "bg-amber-500"
        }
    };

    const PremiumToggle = ({ label, subLabel, icon: Icon, value, onChange, disabled, activeColor = "emerald" }) => {
        const styles = TOGGLE_STYLES[activeColor] || TOGGLE_STYLES.emerald;

        return (
            <div className={cn(
                "flex items-center justify-between p-4 rounded-xl transition-all duration-300 border border-transparent",
                "bg-white/5 hover:bg-white/10",
                value ? `${styles.activeBorder} ${styles.activeShadow}` : "border-white/5"
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-3 rounded-lg transition-colors",
                        value ? styles.iconBgMatch : "bg-slate-800 text-slate-500"
                    )}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className={cn("font-bold text-base transition-colors", value ? "text-white" : "text-slate-400")}>{label}</p>
                        <p className="text-xs text-slate-500 font-medium">{subLabel}</p>
                    </div>
                </div>

                <button
                    onClick={onChange}
                    disabled={disabled}
                    className={cn(
                        "relative w-14 h-8 rounded-full transition-all duration-300 shadow-inner",
                        value ? styles.trackActive : "bg-slate-700/50 border border-white/10",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <div className={cn(
                        "absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center",
                        value ? "right-1 rotate-0" : "left-1 -rotate-180 bg-slate-400"
                    )}>
                        {value && <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${styles.dotActive}`} />}
                    </div>
                </button>
            </div>
        );
    };
    const WALLPAPERS = [
        { id: 'skyjo', name: 'Original', url: '/Wallpapers/bg-skyjo.png', color: 'bg-emerald-500' },
        { id: 'eau', name: 'Eau Calme', url: '/Wallpapers/Eau.png', color: 'bg-cyan-600' },
        { id: 'mystique', name: 'Mystique', url: '/Wallpapers/Mystique.png', color: 'bg-purple-900' },
        { id: 'noir', name: 'Noir Premium', url: '/Wallpapers/Noir premium.png', color: 'bg-slate-900' },
        { id: 'stellaire', name: 'Stellaire', url: '/Wallpapers/stellaire.png', color: 'bg-indigo-900' },
    ];
    return (
        <div className="space-y-6 pb-32 animate-in fade-in zoom-in-95 duration-700">
            {/* Hero Header */}
            <div className="relative text-center py-8">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-20 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
                <h1 className="relative text-4xl font-black text-white drop-shadow-lg tracking-tight flex items-center justify-center gap-3">
                    <Settings className="w-8 h-8 text-skyjo-blue animate-spin-slow-reverse" />
                    RÉGLAGES
                </h1>
                <p className="relative text-sm text-sky-200/60 font-medium uppercase tracking-widest mt-2">
                    Personnalisez votre expérience
                </p>
            </div>

            {/* Wallpaper Selection Modal */}
            {isWallpaperModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        onClick={() => setIsWallpaperModalOpen(false)}
                    />
                    <div className="relative w-full max-w-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <Palette className="w-6 h-6 text-indigo-400" />
                                Choisir un fond d'écran
                            </h3>
                            <button
                                onClick={() => setIsWallpaperModalOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {WALLPAPERS.map((wp) => (
                                    <button
                                        key={wp.id}
                                        onClick={() => setBackground(wp.url)}
                                        className={cn(
                                            "relative group flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300",
                                            "border-2 hover:scale-[1.02] active:scale-95",
                                            background === wp.url
                                                ? "bg-white/10 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                                                : "bg-white/5 border-transparent hover:bg-white/8 hover:border-white/10"
                                        )}
                                    >
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
                                            <div className={cn("absolute inset-0 opacity-40", wp.color)} />
                                            <img
                                                src={wp.url}
                                                alt={wp.name}
                                                onError={(e) => e.target.style.display = 'none'}
                                                className={cn(
                                                    "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
                                                    background === wp.url ? "scale-110" : "scale-100"
                                                )}
                                            />
                                            {background === wp.url && (
                                                <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur-[1px] flex items-center justify-center">
                                                    <div className="bg-white rounded-full p-1.5 shadow-xl animate-bounce-in">
                                                        <Check className="w-4 h-4 text-indigo-600 stroke-[4]" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <span className={cn(
                                            "text-[11px] font-black uppercase tracking-widest transition-colors",
                                            background === wp.url ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                                        )}>
                                            {wp.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Audio Section */}
            <Card className="glass-premium border-white/10 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-white text-xl">
                        <div className="h-1 w-1 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa]" />
                        Immersion & Audio
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 relative z-10">
                    {/* Wallpaper Button */}
                    <button
                        onClick={() => setIsWallpaperModalOpen(true)}
                        className="w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 border border-white/5 bg-white/5 hover:bg-white/10 hover:border-indigo-500/30 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-indigo-500/20 text-indigo-400 transition-colors group-hover:bg-indigo-500/30 group-hover:text-indigo-300">
                                <Palette className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-base text-white">Fond d'écran</p>
                                <p className="text-xs text-slate-500 font-medium group-hover:text-slate-400">Personnaliser l'apparence</p>
                            </div>
                        </div>
                        <div className="p-2 rounded-full bg-white/5 text-slate-400 group-hover:text-white transition-colors">
                            <ChevronRight className="h-5 w-5" />
                        </div>
                    </button>
                    <PremiumToggle
                        label="Musique"
                        subLabel="Ambiance chill pour se concentrer"
                        icon={musicEnabled ? Music : Music2}
                        value={musicEnabled}
                        onChange={toggleMusic}
                        activeColor="emerald"
                    />
                    <PremiumToggle
                        label="Effets Sonores"
                        subLabel="Bruitages de cartes et victoires"
                        icon={soundEnabled ? Volume2 : VolumeX}
                        value={soundEnabled}
                        onChange={toggleSound}
                        activeColor="sky"
                    />
                    <PremiumToggle
                        label="Vibrations"
                        subLabel="Retours haptiques au toucher"
                        icon={Smartphone}
                        value={vibrationEnabled}
                        onChange={toggleVibration}
                        activeColor="purple"
                    />
                </CardContent>
            </Card>

            {/* Notifications & Social */}
            <Card className="glass-premium border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-white text-xl">
                        <div className="h-1 w-1 bg-amber-400 rounded-full shadow-[0_0_10px_#fbbf24]" />
                        Social & Système
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <PremiumToggle
                        label="Notifications Push"
                        subLabel={
                            !isSupported ? "Non supporté sur cet appareil" :
                                permission === 'denied' ? "Bloqué (vérifiez les réglages)" :
                                    "Invitations et mises à jour"
                        }
                        icon={isSubscribed ? Bell : BellOff}
                        value={isSubscribed}
                        onChange={handleTogglePush}
                        disabled={!isSupported}
                        activeColor="amber"
                    />

                    {/* Buttons Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <button
                            onClick={onViewChangelog}
                            className="col-span-2 flex flex-row items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/40 active:scale-95 transition-all group relative overflow-hidden"
                        >
                            <div className="p-2 bg-emerald-500/20 rounded-full group-hover:scale-110 transition-transform">
                                <Sparkles className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-bold text-emerald-100">Nouveautés</span>
                                <span className="text-[10px] text-emerald-400/60 uppercase tracking-widest">v2.5.0</span>
                            </div>
                        </button>

                        <button
                            onClick={() => setIsTutorialOpen(true)}
                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all gap-2 group"
                        >
                            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 group-hover:scale-110 transition-transform">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-300 text-sm">Règles Classique</span>
                        </button>

                        <button
                            onClick={() => setIsBonusTutorialOpen(true)}
                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all gap-2 group"
                        >
                            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 group-hover:scale-110 transition-transform">
                                <Swords className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-300 text-sm">Règles Tourment</span>
                        </button>
                    </div>
                </CardContent>
            </Card>

            <Tutorial
                isOpen={isTutorialOpen}
                onClose={() => setIsTutorialOpen(false)}
            />
            <BonusTutorial
                isOpen={isBonusTutorialOpen}
                onClose={() => setIsBonusTutorialOpen(false)}
            />

            {/* Data Management */}
            <Card className="glass-premium dark:glass-dark shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-100">
                        <Trash2 className="h-5 w-5 text-red-400" />
                        Données
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!showConfirmReset ? (
                        <Button
                            variant="outline"
                            className="w-full justify-start text-red-400 border-red-500/30 hover:bg-red-500/10"
                            onClick={() => setShowConfirmReset(true)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Réinitialiser l'historique des parties
                        </Button>
                    ) : (
                        <div className="space-y-3 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                            <div className="flex items-center gap-2 text-red-400">
                                <AlertTriangle className="h-5 w-5" />
                                <p className="font-medium">Confirmer la suppression ?</p>
                            </div>
                            <p className="text-sm text-slate-400">
                                Cette action supprimera définitivement tout l'historique des parties. Cette action est irréversible.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowConfirmReset(false)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    onClick={handleResetHistory}
                                >
                                    Supprimer
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Feedback */}
            <Card className="glass-premium dark:glass-dark shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-100">
                        <MessageSquare className="h-5 w-5 text-purple-400" />
                        Feedback
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                            BETA
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-400 mb-4">
                        Vous avez des suggestions, des bugs à signaler ou des idées d'amélioration ? Faites-nous part de vos retours !
                    </p>
                    <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                        onClick={() => setIsFeedbackOpen(true)}
                    >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Envoyer un commentaire
                    </Button>
                </CardContent>
            </Card>

            {/* Version & About */}
            <AboutSection
                appVersion="v2.5.0"
                onAdminUnlock={handleAdminUnlock}
            />

            {/* Modals */}

        </div>
    );
}
