import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Music2, Trash2, MessageSquare, ExternalLink, AlertTriangle, Smartphone, Settings, ScrollText, Layers, Zap, RefreshCw, Palette, Image as ImageIcon, ChevronRight, X, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { useGameStore } from '../store/gameStore';
import { cn } from '../lib/utils';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Bell, BellOff } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { AboutSection } from './AboutSection';
import BonusTutorial from './BonusTutorial';
import { FuryRulesModal } from './virtual/FuryUI';

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
    const [rules, setRules] = useState(null);
    const isWallpaperModalOpen = useGameStore(state => state.isWallpaperModalOpen);
    const setIsWallpaperModalOpen = useGameStore(state => state.setIsWallpaperModalOpen);

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
    return (
        <div className="space-y-6 pb-32 animate-in fade-in zoom-in-95 duration-700">

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

                    <div className="settings-actions">
                        <button
                            type="button"
                            onClick={onViewChangelog}
                            className="settings-action settings-action--news"
                        >
                            <ScrollText size={21} strokeWidth={1.65} className="settings-action-icon" aria-hidden="true" />
                            <span className="settings-action-copy">
                                <strong>Nouveautés</strong>
                                <small>{typeof __APP_VERSION__ !== 'undefined' ? `v${__APP_VERSION__}` : 'v3.0.1'}</small>
                            </span>
                            <ChevronRight size={16} className="settings-action-arrow" aria-hidden="true" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setRules('tourment')}
                            className="settings-action settings-action--tourment"
                        >
                            <Layers size={22} strokeWidth={1.65} className="settings-action-icon" aria-hidden="true" />
                            <strong>Règles Tourment</strong>
                        </button>

                        <button
                            type="button"
                            onClick={() => setRules('fury')}
                            className="settings-action settings-action--fury"
                        >
                            <Zap size={22} strokeWidth={1.65} className="settings-action-icon" aria-hidden="true" />
                            <strong>Règles Fury</strong>
                        </button>
                    </div>
                </CardContent>
            </Card>

            <BonusTutorial
                isOpen={rules === 'tourment'}
                onClose={() => setRules(null)}
            />
            <FuryRulesModal
                open={rules === 'fury'}
                onClose={() => setRules(null)}
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
                appVersion={typeof __APP_VERSION__ !== 'undefined' ? `v${__APP_VERSION__}` : 'v3.0.1'}
                onAdminUnlock={handleAdminUnlock}
            />

            {/* Modals */}

        </div>
    );
}
