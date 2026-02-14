import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, User, Sparkles, Gamepad2, RefreshCw, CheckCircle, Edit2, ArrowRight, HelpCircle, Trophy, Play, Settings, Download, Zap } from 'lucide-react';
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
import WhatsNewModal, { CURRENT_NEWS_VERSION } from './WhatsNewModal';
import { TiltCard } from './ui/TiltCard';
import { PremiumTiltButton } from './ui/PremiumTiltButton';

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

const useSyncedAnimation = () => {
    const ref = useRef(null);
    useEffect(() => {
        let frameId;
        const animate = () => {
            const time = Date.now() / 1000;
            const angle = (time * 60) % 360; // 60 deg per second
            if (ref.current) {
                ref.current.style.setProperty('--rotation', `${angle}deg`);
            }
            frameId = requestAnimationFrame(animate);
        };
        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, []);
    return ref;
};

export default function GameSetup({ onNavigate, onOpenTutorial }) {
    const [players, setPlayers] = useState([
        { name: '', avatarId: 'frog' }
    ]);
    const [openAvatarSelector, setOpenAvatarSelector] = useState(null); // Index of player selecting
    const setConfiguration = useGameStore(state => state.setConfiguration);
    const { playStart } = useFeedback();
    const { checkForUpdates, isChecking, checkResult } = useUpdateCheck();

    // Unified Skyjo Score Container - Premium Redesign
    // refs already defined below

    // News State
    const [showWhatsNew, setShowWhatsNew] = useState(false);
    const [hasUnreadNews, setHasUnreadNews] = useState(false);

    useEffect(() => {
        const lastSeenVersion = parseInt(localStorage.getItem('skyjo_news_version') || '0');
        if (lastSeenVersion < CURRENT_NEWS_VERSION) {
            setHasUnreadNews(true);
            setShowWhatsNew(true); // Auto-open for new updates
        }
    }, []);

    // Unified Skyjo Score Container animation refs
    const scoreContainerRef = useRef(null);
    const virtualContainerRef = useRef(null);

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
        const finalPlayers = players.map((p, i) => ({
            name: p.name.trim() || `Joueur ${i + 1}`,
            avatarId: p.avatarId
        }));
        playStart();
        setConfiguration(finalPlayers, 100); // Default threshold 100
    };
    return (
        <div className="max-w-md mx-auto p-2 space-y-2 animate-in fade-in zoom-in duration-300 h-[calc(100vh-5rem)] flex flex-col justify-center overflow-hidden">
            {/* Header Premium */}
            {/* Unified Skyjo Score Container - Premium Redesign */}
            <div ref={scoreContainerRef} className="w-full relative group overflow-hidden rounded-[24px] shadow-[0_20px_60px_-15px_rgba(14,165,233,0.3)] transition-all hover:shadow-[0_30px_70px_-15px_rgba(14,165,233,0.4)]">
                {/* Static Premium Border */}
                <div className="absolute inset-0 rounded-[24px] border border-white/10 z-0" />

                {/* Glass Background (Premium Ultra) */}
                <div className="absolute inset-[1px] bg-[#0f172a]/70 backdrop-blur-2xl rounded-[23px] z-10" />

                {/* Internal Ambient Gradient (Blue/Cyan for Score) */}
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 via-transparent to-purple-500/20 opacity-30 z-10 pointer-events-none rounded-[24px]" />

                {/* Decorative Top Beam */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-sky-400 to-transparent z-20 opacity-60" />

                {/* Content Layer */}
                <div className="relative z-20 flex flex-col items-stretch h-full">
                    {/* Header Section */}
                    <div className="relative p-3 flex items-center gap-4 border-b border-white/5 bg-white/5">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border border-sky-400/50 bg-slate-900 shrink-0 relative z-30 group-hover:scale-105 transition-transform duration-500 animate-breathing" style={{ transform: "translateZ(40px)" }}>
                            <div className="absolute inset-0 bg-sky-500/20 mix-blend-overlay" />
                            <img
                                src="/Gemini_Generated_Image_auzhtfauzhtfauzh.png"
                                alt="Skyjo Logo"
                                className="w-full h-full object-cover scale-110"
                            />
                        </div>
                        <div className="text-left flex-1 relative z-30">
                            <h1 className="text-2xl font-black text-white drop-shadow-md tracking-tight flex items-center gap-2">
                                SkyJo sur table
                                <span className="flex h-2 w-2 relative mt-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                                </span>
                            </h1>
                            <p className="text-sky-400 font-bold text-sm tracking-wide flex items-center gap-1.5">
                                <Trophy className="h-3 w-3" />
                                COMPTEUR DE POINTS
                            </p>
                            <p className="text-xs text-slate-400 font-medium mt-1 opacity-80">
                                Pour vos parties physiques
                            </p>
                        </div>
                    </div>

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
                            contentClassName="border border-sky-500/40 rounded-2xl"
                        >
                            <span className="flex items-center gap-2 text-sky-400 font-black tracking-[0.1em] uppercase text-sm">
                                <Play className="h-4 w-4 fill-current" />
                                C'est parti
                            </span>
                        </PremiumTiltButton>
                    </div>
                </div>
            </div>

            {/* Virtual Game Section */}
            {/* Virtual Game Section */}
            {/* Virtual Game Section - Premium Redesign for 16:9 Image */}
            <motion.button
                ref={virtualContainerRef}
                onClick={() => {
                    playStart();
                    onNavigate?.('virtual');
                }}
                className="w-full relative group cursor-pointer overflow-hidden rounded-[24px] transition-all hover:scale-[1.02] shadow-[0_20px_50px_rgba(147,51,234,0.3)] mt-4 aspect-video flex-none"
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
                {/* Static Premium Border */}
                <div className="absolute inset-0 rounded-[24px] border border-white/10 z-0" />

                {/* Background Image Container */}
                <div className="absolute inset-[2px] rounded-[22px] overflow-hidden z-10 bg-slate-900">
                    <img
                        src="/SkyJo Virtuel.png"
                        alt="Mode Virtuel"
                        className="w-full h-full object-cover object-center opacity-100 group-hover:scale-105 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                </div>

                {/* Content Layer - Centered Arrow only */}
                <div className="absolute bottom-4 right-4 z-20">
                    <div className="w-16 h-16 shrink-0 rounded-full bg-slate-900/30 backdrop-blur-md border border-white/10 text-white flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] group-hover:scale-110 group-hover:bg-slate-900/50 transition-all duration-300 aspect-square animate-pulse-slow">
                        <ArrowRight className="w-8 h-8 drop-shadow-md opacity-90" strokeWidth={3} />
                    </div>
                </div>
            </motion.button>

            {/* Footer Actions */}
            <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                <Button
                    variant="premium"
                    onClick={() => onOpenTutorial?.()}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold"
                >
                    <HelpCircle className="w-4 h-4" />
                    TUTORIEL
                </Button>

                <Button
                    variant="premium"
                    onClick={() => {
                        setShowWhatsNew(true);
                        setHasUnreadNews(false);
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

                <div className="col-span-2 flex gap-3">
                    <motion.button
                        onClick={checkForUpdates}
                        disabled={isChecking}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all text-xs font-bold border relative overflow-hidden",
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
                                v2.5.1 ✓
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
                    </motion.button>

                    <InstallPWA
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#9850E1]/10 hover:bg-[#9850E1]/20 border border-[#9850E1]/30 hover:border-[#9850E1]/50 rounded-xl text-[#9850E1] hover:text-[#d09dfc] transition-all text-xs font-bold uppercase tracking-wider"
                    />
                </div>
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
                    setShowWhatsNew(false);
                    if (hasUnreadNews) {
                        setHasUnreadNews(false);
                        localStorage.setItem('skyjo_news_version', CURRENT_NEWS_VERSION.toString());
                    }
                }}
            />
        </div>
    );
}
