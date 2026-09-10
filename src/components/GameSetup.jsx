import { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import { Plus, X, User, Sparkles, Gamepad2, RefreshCw, CheckCircle, Edit2, ArrowRight, HelpCircle, Play, Settings, Download, Zap } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
// Card imports removed as they are no longer used
// Card imports removed as they are no longer used
import InstallPWA from './InstallPWA';
import { useGameStore } from '../store/gameStore';
import { useFeedback } from '../hooks/useFeedback';
import { useUpdateCheck } from './UpdatePrompt';
import { cn } from '../lib/utils';
import { AVATARS, getAvatarPath } from '../lib/avatars';
import AvatarSelector from './AvatarSelector';
import PseudoModal from './PseudoModal';
import WhatsNewModal, { CURRENT_NEWS_VERSION } from './WhatsNewModal';
import { TiltCard } from './ui/TiltCard';
import { PremiumTiltButton } from './ui/PremiumTiltButton';
import SkyjoVirtuelButton from './ui/SkyjoVirtuelButton';

/* global __APP_VERSION__ */

// Couleurs uniques pour chaque joueur
const PLAYER_COLORS = [
    { bg: 'bg-emerald-500', text: 'text-emerald-700', light: 'bg-emerald-100' },
    { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
    { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-100' },
    { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-100' },
    { bg: 'bg-rose-500', text: 'text-rose-700', light: 'bg-rose-100' },
    { bg: 'bg-cyan-500', text: 'text-cyan-700', light: 'bg-cyan-100' },
    { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-100' },
    { bg: 'bg-pink-500', text: 'text-pink-700', light: 'bg-pink-100' },
];


export default function GameSetup({
    onNavigate,
    onOpenTutorial,
    showGuide = false,
    allowAutoNews = true,
    onWhatsNewVisibilityChange
}) {
    const [players, setPlayers] = useState([
        { name: '', avatarId: 'frog' }
    ]);
    const [openAvatarSelector, setOpenAvatarSelector] = useState(null); // Index of player selecting
    
    const setConfiguration = useGameStore(state => state.setConfiguration);
    const updateUserProfile = useGameStore(state => state.updateUserProfile);
    const { playStart } = useFeedback();
    const { checkForUpdates, isChecking, checkResult } = useUpdateCheck();

    const [showPseudoModal, setShowPseudoModal] = useState(false);

    // Unified Skyjo Score Container - Premium Redesign
    // refs already defined below

    // News State
    const [isNewsManuallyOpen, setIsNewsManuallyOpen] = useState(false);
    const [hasDismissedAutoNews, setHasDismissedAutoNews] = useState(false);
    const hasUnreadNews = Number.parseInt(
        localStorage.getItem('skyjo_news_version') || '0',
        10
    ) < CURRENT_NEWS_VERSION;
    const showWhatsNew = isNewsManuallyOpen
        || (allowAutoNews && hasUnreadNews && !hasDismissedAutoNews);

    useEffect(() => {
        onWhatsNewVisibilityChange?.(showWhatsNew);
    }, [onWhatsNewVisibilityChange, showWhatsNew]);

    useEffect(() => (
        () => onWhatsNewVisibilityChange?.(false)
    ), [onWhatsNewVisibilityChange]);

    // Unified Skyjo Score Container animation refs
    const addPlayer = () => {
        if (players.length < 8) {
            // Cycle through available avatars
            const nextAvatarId = AVATARS[players.length % AVATARS.length].id;
            setPlayers([...players, { name: '', avatarId: nextAvatarId }]);
        }
    };

    const removePlayer = (index) => {
        if (players.length > 2) {
            const newPlayers = [...players];
            newPlayers.splice(index, 1);
            setPlayers(newPlayers);
        }
    };

    const updateName = (index, name) => {
        const newPlayers = [...players];
        newPlayers[index] = { ...newPlayers[index], name };
        setPlayers(newPlayers);
    };

    const updateAvatar = (index, avatarId) => {
        const newPlayers = [...players];
        newPlayers[index] = { ...newPlayers[index], avatarId };
        setPlayers(newPlayers);
        setOpenAvatarSelector(null);
    };

    const handleStart = () => {
        // Validation: All players must have a name and it shouldn't be "Joueur"
        const invalidPlayer = players.find(p => !p.name.trim() || p.name.trim().toLowerCase() === 'joueur');

        if (invalidPlayer) {
            setShowPseudoModal(true);
            return;
        }

        const finalPlayers = players.map((p) => ({
            name: p.name.trim(),
            avatarId: p.avatarId
        }));
        playStart();
        setConfiguration(finalPlayers, 100); // Default threshold 100
    };
    return (
        <div className="max-w-md mx-auto p-2 space-y-2 animate-in fade-in zoom-in duration-300 h-[calc(100vh-5rem)] flex flex-col justify-center">
            {/* Header Premium */}
            {/* Unified Skyjo Score Container - Premium Redesign */}
            <div className="w-full relative group">
                {/* Main panel shares the virtual mode palette and fine border. */}
                <div className="relative z-10 w-full overflow-hidden rounded-[24px] border border-cyan-200/15 shadow-[0_12px_32px_-16px_rgba(14,165,233,0.18)] bg-[#080d24] flex flex-col items-stretch">

                    <h1 className="m-0 border-b border-cyan-200/10">
                        <img src="/skyjo-real-mode-header.svg" alt="Skyjo édition réelle" className="block w-full h-auto" />
                    </h1>

                    {/* Players Section */}
                    <div className="relative p-3 space-y-2 flex-1 bg-gradient-to-b from-slate-900/50 to-transparent">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                            <span className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-sky-500" />
                                Joueurs ({players.length})
                            </span>
                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full border border-white/5">Max 8</span>
                        </div>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                            {players.map((player, index) => {
                                return (
                                    <div
                                        key={index}
                                        className="flex gap-3 items-center bg-slate-800/40 p-2 rounded-xl border border-white/5 hover:border-sky-500/30 transition-colors group/card"
                                    >
                                        {/* Avatar Selector Button */}
                                        <button
                                            type="button"
                                            onClick={() => setOpenAvatarSelector(index)}
                                            className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all hover:scale-105 border border-white/10 overflow-hidden relative group",
                                                "bg-slate-800 ring-1 ring-white/5 hover:ring-sky-400/50"
                                            )}
                                        >
                                            <div className="absolute inset-0 bg-white">
                                                <img
                                                    src={getAvatarPath(player.avatarId)}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    onError={(e) => { e.target.src = '/avatars/cat.png' }} // Fallback
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-tr from-black/0 via-white/20 to-white/0 opacity-50 pointer-events-none" />
                                            </div>
                                            <div className="absolute bottom-0 right-0 p-0.5 bg-black/60 rounded-tl-md backdrop-blur-[2px]">
                                                <Edit2 className="w-2 h-2 text-white/90" />
                                            </div>
                                        </button>

                                        {/* Name Input */}
                                        <div className="relative flex-1">
                                            <Input
                                                placeholder={`Joueur ${index + 1}`}
                                                value={player.name}
                                                onChange={(e) => updateName(index, e.target.value)}
                                                className={cn(
                                                    "h-10 bg-slate-900/50 border-transparent focus:bg-slate-900 focus:border-sky-500 transition-all font-bold text-white placeholder:text-slate-600 rounded-lg text-sm px-3",
                                                    player.name && "text-sky-100"
                                                )}
                                            />
                                        </div>

                                        {/* Remove Button */}
                                        {players.length > 2 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removePlayer(index)}
                                                className="shrink-0 h-9 w-9 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover/card:opacity-100"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {players.length < 8 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-10 border-dashed border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-sky-400 hover:border-sky-500/30 bg-transparent transition-all rounded-xl hover:shadow-[0_0_15px_rgba(14,165,233,0.1)] group"
                                onClick={addPlayer}
                            >
                                <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" /> Ajouter un joueur
                            </Button>
                        )}
                    </div>

                    {/* Action Section */}
                    <div className="relative p-3 pt-2 pb-3 bg-gradient-to-t from-slate-900/80 to-transparent">
                        <PremiumTiltButton
                            onClick={handleStart}
                            gradientFrom="from-slate-800"
                            gradientTo="to-slate-950"
                            shadowColor="shadow-sky-500/10"
                            contentClassName="border border-sky-500/40 rounded-2xl py-3"
                        >
                            <span className="flex items-center gap-2 text-sky-400 font-black tracking-[0.1em] uppercase text-sm">
                                <Play className="h-4 w-4 fill-current" />
                                C'est parti
                            </span>
                        </PremiumTiltButton>
                    </div>
                </div>
            </div>

            {/* Virtual Game Section - Integrated SkyjoVirtuelButton */}
            <SkyjoVirtuelButton
                onClick={() => {
                    playStart();
                    onNavigate?.('virtual');
                }}
            />


            {/* Footer Actions */}
            <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                {showGuide && (
                    <Button
                        variant="premium"
                        onClick={() => onOpenTutorial?.()}
                        className="col-span-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold"
                    >
                        <HelpCircle className="w-4 h-4" />
                        GUIDE
                    </Button>
                )}

                <Button
                    variant="premium"
                    onClick={() => {
                        setIsNewsManuallyOpen(true);
                        localStorage.setItem('skyjo_news_version', CURRENT_NEWS_VERSION.toString());
                    }}
                    className={cn(
                        "relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all text-xs font-bold overflow-hidden",
                        hasUnreadNews ? "animate-button-pulse ring-2 ring-indigo-500/50" : ""
                    )}
                >
                    <Sparkles className={cn("w-4 h-4", hasUnreadNews && "text-indigo-300")} />
                    NOUVEAUTÉS
                </Button>

                <Motion.button
                    onClick={checkForUpdates}
                    disabled={isChecking}
                    className={cn(
                        "flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all text-xs font-bold border relative overflow-hidden",
                        checkResult === 'up-to-date'
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : checkResult === 'update-available'
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-glow-pulse"
                                : "bg-slate-800/40 hover:bg-slate-700/50 text-slate-400 hover:text-white border-white/5 hover:border-white/10"
                    )}
                    whileTap={{ scale: 0.95 }}
                >
                    {isChecking ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : checkResult === 'up-to-date' ? (
                        <>
                            <CheckCircle className="w-4 h-4" />
                            v{__APP_VERSION__} ✓
                        </>
                    ) : checkResult === 'update-available' ? (
                        <>
                            <Zap className="w-4 h-4 animate-pulse" />
                            NOUVELLE VERSION !
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4" />
                            MISE À JOUR
                        </>
                    )}
                </Motion.button>

                <InstallPWA
                    className="col-span-2 flex items-center justify-center gap-2 py-3 px-4 bg-[#9850E1]/10 hover:bg-[#9850E1]/20 border border-[#9850E1]/30 hover:border-[#9850E1]/50 rounded-xl text-[#9850E1] hover:text-[#d09dfc] transition-all text-xs font-bold uppercase tracking-wider"
                />
            </div>

            {/* Modals */}
            <AvatarSelector
                isOpen={openAvatarSelector !== null}
                onClose={() => setOpenAvatarSelector(null)}
                selectedId={openAvatarSelector !== null ? players[openAvatarSelector].avatarId : null}
                onSelect={(id) => updateAvatar(openAvatarSelector, id)}
            />
            <WhatsNewModal
                isOpen={showWhatsNew}
                onClose={() => {
                    setIsNewsManuallyOpen(false);
                    setHasDismissedAutoNews(true);
                    if (hasUnreadNews) {
                        localStorage.setItem('skyjo_news_version', CURRENT_NEWS_VERSION.toString());
                    }
                }}
            />
            <PseudoModal
                isOpen={showPseudoModal}
                onClose={() => setShowPseudoModal(false)}
                initialValue={players[0]?.name || ''}
                onConfirm={(newPseudo) => {
                    setShowPseudoModal(false);
                    const updatedPlayers = [...players];
                    updatedPlayers[0] = { ...updatedPlayers[0], name: newPseudo };
                    setPlayers(updatedPlayers);
                    updateUserProfile({ name: newPseudo });

                    // Check if everything is now valid to start
                    if (updatedPlayers.every(p => p.name.trim() && p.name.trim().toLowerCase() !== 'joueur')) {
                        const finalPlayers = updatedPlayers.map((p) => ({
                            name: p.name.trim(),
                            avatarId: p.avatarId
                        }));
                        playStart();
                        setConfiguration(finalPlayers, 100);
                    }
                }}
            />
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
                    50% { transform: translateY(-20px) translateX(10px); opacity: 0.7; }
                }
                @keyframes breath {
                    0%, 100% { transform: scale(1); filter: brightness(1); }
                    50% { transform: scale(1.03); filter: brightness(1.1); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.3; }
                    50% { transform: scale(1.1) translate(10px, 5px); opacity: 0.5; }
                }
            `}} />
        </div>
    );
}
