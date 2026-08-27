import React from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { Bot, ChevronRight, Users, Wifi, HelpCircle, Palette, X, Sparkles, RotateCcw, Zap, Swords, Flame, Image as ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { PremiumTiltButton } from './ui/PremiumTiltButton';
import SkinCarousel from './SkinCarousel';
import ExperienceBar from './ExperienceBar';
import { useVirtualGameStore } from '../store/virtualGameStore';
import { useGameStore, selectIsDailyAvailable, selectIsWeeklyAvailable } from '../store/gameStore';
import { useOnlineGameStore } from '../store/onlineGameStore';
import { useFeedback } from '../hooks/useFeedback';
import { cn } from '../lib/utils';
import { AI_DIFFICULTY } from '../lib/skyjoAI';
import {
    CURRENT_WEEKLY_CHALLENGE,
    getWeeklyChallengeRemainingDays as calculateWeeklyRemainingDays,
} from '../lib/weeklyChallenge';
import RobotAvatar from './ui/RobotAvatar';
import ModalShell from './ui/ModalShell';

const EquinoxOrbitIcon = ({ active }) => {
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = active && !prefersReducedMotion;

    return (
        <div className="relative flex h-9 w-9 items-center justify-center" aria-hidden="true">
            <div className="absolute inset-1 rounded-full border border-white/20" />
            <span className="relative z-10 text-[20px] drop-shadow-[0_0_7px_rgba(255,255,255,0.45)]">🌍</span>
            <Motion.span
                className="absolute inset-0"
                animate={shouldAnimate ? { rotate: 360 } : { rotate: 28 }}
                transition={shouldAnimate ? { duration: 5, ease: 'linear', repeat: Infinity } : { duration: 0 }}
            >
                <span className="absolute left-1/2 top-[-1px] h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-white/50 bg-gradient-to-br from-amber-100 via-slate-200 to-indigo-400 shadow-[0_0_8px_rgba(251,191,36,0.65)]" />
            </Motion.span>
        </div>
    );
};

export default function GameMenu({
    setScreen,
    playerCardSkin,
    playerLevel,
    setCardSkin
}) {
    const [showRulesModal, setShowRulesModal] = React.useState(false);
    const [showDailyChallengeModal, setShowDailyChallengeModal] = React.useState(false);
    const [selectedDifficulty, setSelectedDifficulty] = React.useState(null);

    const virtualGameState = useVirtualGameStore(state => state.gameState);
    const startAIGame = useVirtualGameStore(state => state.startAIGame);
    const userProfile = useGameStore(state => state.userProfile);
    const connectOnline = useOnlineGameStore(state => state.connect);
    const setPlayerInfo = useOnlineGameStore(state => state.setPlayerInfo);
    const isDailyAvailable = useGameStore(selectIsDailyAvailable);
    const isWeeklyAvailable = useGameStore(selectIsWeeklyAvailable);
    const weeklyChallengeWinDate = useGameStore(state => state.weeklyChallengeWinDate);
    const weeklyChallengeId = useGameStore(state => state.weeklyChallengeId);
    const hasSeenWeeklyAnnouncement = useGameStore(state => state.hasSeenWeeklyChallengeAnnouncementV4);
    const setHasSeenWeeklyAnnouncement = useGameStore(state => state.setHasSeenWeeklyChallengeAnnouncement);
    
    const [showWeeklyAnnouncement, setShowWeeklyAnnouncement] = React.useState(false);
    const { playClick } = useFeedback();

    React.useEffect(() => {
        if (!hasSeenWeeklyAnnouncement) {
            setShowWeeklyAnnouncement(true);
        }
    }, [hasSeenWeeklyAnnouncement]);

    const handleCloseAnnouncement = () => {
        playClick();
        setShowWeeklyAnnouncement(false);
        setHasSeenWeeklyAnnouncement(true);
    };

    const getWeeklyRemainingDays = () => {
        return calculateWeeklyRemainingDays({ weeklyChallengeWinDate, weeklyChallengeId });
    };

    const handleStartAIBattle = () => {
        playClick();
        setScreen('ai-setup');
    };

    const handleStartOnline = () => {
        playClick();
        setPlayerInfo(userProfile.name, userProfile.emoji || 'cat');
        connectOnline();
        setScreen('lobby');
    };

    const handleStartDailyChallenge = () => {
        if (!selectedDifficulty) return;
        playClick();
        startAIGame({ name: userProfile.name, avatarId: userProfile.avatarId }, 1, selectedDifficulty, { isDailyChallenge: true, isBonusMode: selectedDifficulty === AI_DIFFICULTY.BONUS });
        setScreen('game');
        setShowDailyChallengeModal(false);
        setSelectedDifficulty(null);
    };


    return (
        <div className="max-w-md mx-auto px-3 sm:px-4 space-y-4 min-h-[600px] flex flex-col pt-6 sm:pt-8">
            {/* Sticky header + progression */}
            <div className="sticky top-0 z-20 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent pb-4 -mx-3 sm:-mx-4 px-3 sm:px-4 pt-4 -mt-4 rounded-t-[2rem]">
                {/* Header section */}
                <div className="text-center mb-4 space-y-1">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">MODE VIRTUEL</h2>
                    <div className="h-1 w-12 bg-skyjo-blue mx-auto rounded-full" />
                </div>

                <ExperienceBar />
            </div>

            <div className="grid gap-4">
                {/* Resume local game if exists */}
                {virtualGameState && (
                    <PremiumTiltButton
                        onClick={() => {
                            playClick();
                            setScreen('game');
                        }}
                        gradientFrom="from-emerald-600"
                        gradientTo="to-teal-600"
                        shadowColor="shadow-emerald-500/20"
                        className="w-full mb-2"
                        contentClassName="game-mode-card-content"
                    >
                        <div className="flex items-center justify-between w-full relative z-10">
                            <div className="text-left">
                                <h3 className="game-mode-card-title text-white flex items-center gap-2">
                                    <RotateCcw className="h-5 w-5 animate-spin-slow" />
                                    REPRENDRE LA PARTIE
                                </h3>
                                <p className="game-mode-card-meta text-emerald-100 uppercase">
                                    Continuez votre combat contre l'IA
                                </p>
                            </div>
                            <div className="game-mode-icon bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center">
                                <ChevronRight className="h-6 w-6 text-white group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </PremiumTiltButton>
                )}

                <PremiumTiltButton
                    onClick={handleStartAIBattle}
                    gradientFrom="from-purple-600"
                    gradientTo="to-indigo-600"
                    shadowColor="shadow-purple-500/20"
                    className="w-full"
                    contentClassName="game-mode-card-content"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between w-full relative z-10 text-left">
                        <div className="flex flex-col justify-center">
                            <h3 className="game-mode-card-title text-white">
                                JOUER CONTRE L'IA
                            </h3>
                            <p className="game-mode-card-meta text-indigo-200 uppercase">
                                Entraînez-vous en solo
                            </p>
                        </div>
                        <div className="game-mode-icon bg-purple-500/30 border border-purple-400/50 flex items-center justify-center icon-3d-container">
                            <Bot className="h-6 w-6 text-white icon-3d animate-float-3d" />
                        </div>
                    </div>
                </PremiumTiltButton>

                {/* Défi Quotidien */}
                <PremiumTiltButton
                    onClick={() => {
                        if (!isDailyAvailable) return;
                        playClick();
                        setShowDailyChallengeModal(true);
                    }}
                    disabled={!isDailyAvailable}
                    gradientFrom={isDailyAvailable ? "from-[#f971fb]" : "from-slate-700"}
                    gradientTo={isDailyAvailable ? "to-[#d946ef]" : "to-slate-800"}
                    shadowColor={isDailyAvailable ? "shadow-[#f971fb]/25" : "shadow-transparent"}
                    className={cn("w-full transition-all duration-500 group", !isDailyAvailable && "opacity-60 grayscale-[0.3]")}
                    contentClassName="game-mode-card-content"
                >
                    <div className="flex items-center justify-between w-full relative z-10 text-left">
                        <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-2">
                                <h3 className="game-mode-card-title text-white">DÉFI QUOTIDIEN</h3>
                                {isDailyAvailable && (
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                                )}
                            </div>
                            <p className={cn(
                                "game-mode-card-meta uppercase",
                                isDailyAvailable ? "text-amber-100" : "text-slate-400"
                            )}>
                                {isDailyAvailable ? (
                                    <>Gagnez une partie = <span className="text-white">Bonus XP</span></>
                                ) : (
                                    "Déjà complété ! À demain"
                                )}
                            </p>
                        </div>

                        <div className={cn(
                            "game-mode-icon border flex items-center justify-center transition-all duration-500 relative overflow-hidden icon-3d-container",
                            isDailyAvailable
                                ? "bg-amber-500/20 border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                                : "bg-slate-800/50 border-white/5"
                        )}>
                            {isDailyAvailable && (
                                <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 to-transparent animate-pulse" />
                            )}
                            <Zap className={cn(
                                "h-6 w-6 transition-all duration-500",
                                isDailyAvailable
                                    ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] icon-3d animate-float-3d"
                                    : "text-slate-600"
                            )} />
                        </div>
                    </div>
                </PremiumTiltButton>                {/* Défi Hebdo - Mode Équinoxe */}
                <PremiumTiltButton
                    onClick={() => {
                        if (!isWeeklyAvailable) return;
                        playClick();
                        // Weekly challenge: Tourment mode (bonus cards + hard AI)
                        startAIGame(
                            { name: userProfile.name, avatarId: userProfile.avatarId },
                            1,
                            AI_DIFFICULTY.BONUS,
                            { isBonusMode: true, isWeeklyChallenge: true },
                        );
                        setScreen('game');
                    }}
                    disabled={!isWeeklyAvailable}
                    gradientFrom={isWeeklyAvailable ? "from-indigo-700" : "from-slate-700"}
                    gradientTo={isWeeklyAvailable ? "to-amber-500" : "to-slate-800"}
                    shadowColor={isWeeklyAvailable ? "shadow-indigo-500/25" : "shadow-transparent"}
                    className={cn("w-full transition-all duration-500 group", !isWeeklyAvailable && "opacity-60 grayscale-[0.3]")}
                    contentClassName="game-mode-card-content"
                    bodyClassName={isWeeklyAvailable
                        ? "border-amber-100/30 ring-1 ring-inset ring-indigo-200/20 shadow-[0_8px_28px_rgba(79,70,229,0.22)]"
                        : "border-white/10"
                    }
                >
                    {isWeeklyAvailable && (
                        <div className="pointer-events-none absolute -right-10 -top-16 h-32 w-32 rounded-full bg-amber-200/20 blur-2xl" />
                    )}
                    <div className="flex items-center justify-between gap-4 w-full relative z-10 text-left">
                        <div className="flex min-w-0 flex-col justify-center">
                            <div className="flex items-center gap-2">
                                <h3 className="game-mode-card-title text-white">{CURRENT_WEEKLY_CHALLENGE.shortTitle}</h3>
                                {isWeeklyAvailable && (
                                    <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[8px] font-black tracking-wider text-amber-100 ring-1 ring-inset ring-white/15">HEBDO</span>
                                )}
                            </div>
                            <p className={cn(
                                "game-mode-card-meta uppercase",
                                isWeeklyAvailable ? "text-indigo-100" : "text-slate-400"
                            )}>
                                {isWeeklyAvailable ? (
                                    <>
                                        <span className="block text-indigo-50">Conservez <strong className="text-white">−2 · 0 · 0 · +2</strong></span>
                                        <span className="mt-0.5 block whitespace-nowrap text-amber-100">Tourment · Victoire <strong className="text-white">+{CURRENT_WEEKLY_CHALLENGE.rewardXP} XP</strong></span>
                                    </>
                                ) : (
                                    <>Réinitialisation dans <span className="text-indigo-300">{getWeeklyRemainingDays()} jours</span></>
                                )}
                            </p>
                        </div>

                        <div className={cn(
                            "game-mode-icon border flex items-center justify-center transition-all duration-500 relative overflow-hidden icon-3d-container",
                            isWeeklyAvailable
                                ? "bg-slate-950/20 border-amber-100/30 shadow-[inset_0_0_14px_rgba(255,255,255,0.08),0_0_18px_rgba(99,102,241,0.30)]"
                                : "bg-slate-800/50 border-white/5"
                        )}>
                            <EquinoxOrbitIcon active={isWeeklyAvailable} />
                        </div>
                    </div>
                </PremiumTiltButton>

                <PremiumTiltButton
                    onClick={handleStartOnline}
                    gradientFrom="from-sky-600"
                    gradientTo="to-blue-600"
                    shadowColor="shadow-sky-500/20"
                    className="w-full"
                    contentClassName="game-mode-card-content"
                >
                    <div className="flex items-center justify-between w-full relative z-10 text-left">
                        <div className="flex flex-col justify-center">
                            <h3 className="game-mode-card-title text-white">JOUER EN LIGNE</h3>
                            <p className="game-mode-card-meta text-blue-100/90 uppercase">Affrontez vos amis à distance</p>
                        </div>
                        <div className="game-mode-icon bg-sky-500/30 border border-sky-400/50 flex items-center justify-center icon-3d-container">
                            <Wifi className="h-6 w-6 text-white icon-3d animate-float-3d" />
                        </div>
                    </div>
                </PremiumTiltButton>

                {/* Rules Button */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setShowRulesModal(true)}
                        className="premium-focus-ring surface-card min-h-14 flex-1 flex items-center justify-center gap-3 p-3.5 hover:border-white/20 transition-all active:scale-[0.98] group"
                    >
                        <HelpCircle className="h-5 w-5 text-amber-500" />
                        <span className="text-sm font-bold text-slate-200">Règles</span>
                    </button>
                    <button
                        onClick={() => {
                            playClick();
                            useGameStore.getState().setIsWallpaperModalOpen(true);
                        }}
                        className="premium-focus-ring surface-card min-h-14 flex-1 flex items-center justify-center gap-3 p-3.5 hover:border-white/20 transition-all active:scale-[0.98] group"
                    >
                        <ImageIcon className="h-5 w-5 text-indigo-400" />
                        <span className="text-sm font-bold text-slate-200">Fond</span>
                    </button>
                </div>
            </div>

            {/* Customization Card */}
            <Card className="glass-premium dark:glass-dark shadow-xl relative mt-6 overflow-hidden">
                <div className="absolute inset-0 bg-purple-500/20 blur-3xl opacity-50 pointer-events-none" />
                <CardHeader className="pb-0 relative z-10">
                    <div className="flex items-center justify-start gap-3 px-1">
                        <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                            <Palette className="h-4 w-4 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-wide">Personnaliser vos cartes</h3>
                    </div>
                </CardHeader>
                <CardContent className="pt-2 pb-6 px-1">
                    <SkinCarousel
                        skins={[
                            { id: 'classic', name: 'Classique', img: '/card-back.png', level: 1 },
                            { id: 'papyrus', name: 'Papyrus', img: '/card-back-papyrus.jpg', level: 3 },
                            { id: 'neon', name: 'Neon', img: '/card-back-neon.png', level: 5 },
                            { id: 'cyberpunk', name: 'Cyberpunk', img: '/card-back-cyberpunk.png', level: 6 },
                            { id: 'carbon', name: 'Carbon', img: '/card-back-carbon.png', level: 8 },
                            { id: 'obsidian', name: 'Obsidian', img: '/card-back-obsidian.png', level: 12 },
                            { id: 'gold', name: 'Gold', img: '/card-back-gold.png', level: 13 },
                            { id: 'galaxy', name: 'Galaxy', img: '/card-back-galaxy.png', level: 18 },
                            { id: 'astral-sigil', name: 'Sceau Astral', img: '/master/card-back-astral-sigil.webp', level: 110 },
                            { id: 'nebula-core', name: 'Cœur de Nébuleuse', img: '/master/card-back-nebula-core.webp', level: 130 },
                            { id: 'cosmic-dragon', name: 'Dragon Cosmique', img: '/master/card-back-cosmic-dragon.webp', level: 150 },
                            { id: 'eternal-prism', name: 'Prisme Éternel', img: '/master/card-back-eternal-prism.webp', level: 170 },
                            { id: 'transcendent-void', name: 'Vide Transcendant', img: '/master/card-back-transcendent-void.webp', level: 190 }
                        ]}
                        selectedSkinId={playerCardSkin}
                        onSelect={setCardSkin}
                        playerLevel={playerLevel}
                    />
                </CardContent>
            </Card>

            {/* Rules Modal */}
            <ModalShell
                isOpen={showRulesModal}
                onClose={() => setShowRulesModal(false)}
                labelledBy="game-rules-title"
                maxWidth="max-w-lg"
                className="flex max-h-[85dvh] flex-col rounded-[2.5rem] bg-slate-950"
            >
                        {/* Background Gradients */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

                        {/* Header */}
                        <div className="relative p-6 px-8 border-b border-white/5 flex items-center justify-between shrink-0">
                            <div>
                                <h2 id="game-rules-title" className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                    <span className="text-3xl">📜</span> Règles du Skyjo
                                </h2>
                                <p className="text-xs font-medium text-white/40 uppercase tracking-widest mt-1">Manuel de jeu officiel v2.0</p>
                            </div>
                            <button
                                onClick={() => setShowRulesModal(false)}
                                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="relative flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">

                            {/* Goal Card */}
                            <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-indigo-400 font-black uppercase text-xs tracking-widest mb-2 flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" /> Objectif Ultime
                                    </h3>
                                    <p className="text-indigo-100/90 text-sm font-medium leading-relaxed">
                                        Avoir le <strong>moins de points possible</strong> à la fin de la partie. La partie s'arrête dès qu'un joueur atteint <strong>100 points</strong>.
                                    </p>
                                </div>
                            </div>

                            {/* Steps Grid */}
                            <div className="space-y-4">

                                {/* Step 1 */}
                                <div className="group p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                    <h3 className="text-amber-400 font-black uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                                        <span className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center text-[10px]">1</span>
                                        Mise en place
                                    </h3>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-3 text-sm text-slate-300">
                                            <span className="w-1 h-1 rounded-full bg-amber-500/50 mt-2 shrink-0" />
                                            <span>Chaque joueur reçoit <strong>12 cartes</strong> (grille 3×4).</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-slate-300">
                                            <span className="w-1 h-1 rounded-full bg-amber-500/50 mt-2 shrink-0" />
                                            <span>Retournez <strong>2 cartes</strong> au hasard.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-slate-300">
                                            <span className="w-1 h-1 rounded-full bg-amber-500/50 mt-2 shrink-0" />
                                            <span>Le plus gros score commence !</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Step 2 */}
                                <div className="group p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                                    <h3 className="text-blue-400 font-black uppercase text-xs tracking-widest mb-3 flex items-center gap-2">
                                        <span className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center text-[10px]">2</span>
                                        Tour de jeu
                                    </h3>
                                    <p className="text-sm text-slate-400 mb-3">À votre tour, choisissez une source :</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 text-center">
                                            <span className="text-xs font-bold text-white block mb-1">LA PIOCHE</span>
                                            <span className="text-[10px] text-slate-400 leading-tight block">Gardez la carte (échange) ou défaussez-la (révélez une carte).</span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5 text-center">
                                            <span className="text-xs font-bold text-white block mb-1">LA DÉFAUSSE</span>
                                            <span className="text-[10px] text-slate-400 leading-tight block">Prenez la carte visible et échangez-la immédiatement.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pro Tips */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                        <h3 className="text-emerald-400 font-bold uppercase text-[10px] tracking-widest mb-2">Combo Colonne</h3>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            3 cartes identiques dans une colonne ? <strong>BIM !</strong> La colonne est éliminée (0 point). <i>Note : La carte Mystère (?) compte comme un 0 pour les combos.</i>
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                                        <h3 className="text-rose-400 font-bold uppercase text-[10px] tracking-widest mb-2">Attention !</h3>
                                        <p className="text-xs text-slate-300 leading-relaxed">
                                            Si vous terminez la manche mais n'avez pas le plus petit score, vos points <strong>doublent</strong> !
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/5 bg-slate-950/30 text-center">
                            <p className="text-[10px] text-white/20 font-medium">Bonne chance, que le meilleur gagne !</p>
                        </div>
            </ModalShell>

            {/* Daily Challenge Difficulty Modal - Portal to Body */}
            {showDailyChallengeModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setShowDailyChallengeModal(false)}
                    />
                    <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Decorative Header Background */}
                        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#F43F5E]/20 via-rose-900/5 to-transparent pointer-events-none" />
                        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#F43F5E]/50 to-transparent opacity-50" />

                        {/* Header with Robot Avatar */}
                        <div className="pt-2 pb-2 text-center relative z-10 flex flex-col items-center">

                            {/* ROBOT AVATAR INTEGRATION */}
                            <div className="scale-50 -my-20 pointer-events-none transform-gpu origin-center">
                                <RobotAvatar
                                    customMessage={selectedDifficulty === AI_DIFFICULTY.BONUS ? "Tu vas souffrir !" : selectedDifficulty === AI_DIFFICULTY.HARD ? "Ça va faire mal !" : "Choisis ton destin..."}
                                    showBubble={!!selectedDifficulty}
                                />
                            </div>

                            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex flex-col items-center justify-center gap-1 -mt-4">
                                <span>Défi Quotidien</span>
                            </h2>
                            <button
                                onClick={() => setShowDailyChallengeModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors z-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-6 pb-6 space-y-6">
                            <p className="text-center text-slate-400 text-xs font-medium leading-relaxed max-w-[280px] mx-auto">
                                Choisissez votre niveau de difficulté pour tenter de remporter des <strong className="text-[#F43F5E]">XP bonus</strong> !
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Hard Mode Selection */}
                                <button
                                    onClick={() => {
                                        playClick();
                                        setSelectedDifficulty(AI_DIFFICULTY.HARD);
                                    }}
                                    className={cn(
                                        "group relative p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3",
                                        selectedDifficulty === AI_DIFFICULTY.HARD
                                            ? "bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                                            : "bg-slate-800/50 border-white/5 hover:border-amber-500/50 hover:bg-slate-800"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                        selectedDifficulty === AI_DIFFICULTY.HARD
                                            ? "bg-amber-500 text-white shadow-lg"
                                            : "bg-slate-700 text-slate-400 group-hover:bg-slate-600 group-hover:text-amber-400"
                                    )}>
                                        <Swords className="w-5 h-5" />
                                    </div>
                                    <div className="text-center flex flex-col items-center gap-1">
                                        <div className={cn(
                                            "font-bold text-sm uppercase tracking-wider transition-colors",
                                            selectedDifficulty === AI_DIFFICULTY.HARD ? "text-white" : "text-slate-300"
                                        )}>Difficile</div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[11px] font-black tracking-tighter shadow-sm transition-all duration-300",
                                            selectedDifficulty === AI_DIFFICULTY.HARD
                                                ? "bg-amber-500 text-white animate-pulse"
                                                : "bg-slate-700 text-slate-400"
                                        )}>
                                            +3 XP
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-medium group-hover:text-slate-400 mt-1">Défi corsé</div>
                                    </div>
                                </button>

                                {/* Tournament Mode Selection */}
                                <button
                                    onClick={() => {
                                        playClick();
                                        setSelectedDifficulty(AI_DIFFICULTY.BONUS);
                                    }}
                                    className={cn(
                                        "group relative p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-3",
                                        selectedDifficulty === AI_DIFFICULTY.BONUS
                                            ? "bg-rose-500/10 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                                            : "bg-slate-800/50 border-white/5 hover:border-rose-500/50 hover:bg-slate-800"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                        selectedDifficulty === AI_DIFFICULTY.BONUS
                                            ? "bg-rose-500 text-white shadow-lg"
                                            : "bg-slate-700 text-slate-400 group-hover:bg-slate-600 group-hover:text-rose-400"
                                    )}>
                                        <Flame className="w-5 h-5" />
                                    </div>
                                    <div className="text-center flex flex-col items-center gap-1">
                                        <div className={cn(
                                            "font-bold text-sm uppercase tracking-wider transition-colors",
                                            selectedDifficulty === AI_DIFFICULTY.BONUS ? "text-white" : "text-slate-300"
                                        )}>Tourment</div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[11px] font-black tracking-tighter shadow-sm transition-all duration-300",
                                            selectedDifficulty === AI_DIFFICULTY.BONUS
                                                ? "bg-rose-500 text-white animate-pulse"
                                                : "bg-slate-700 text-slate-400"
                                        )}>
                                            +6 XP
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-medium group-hover:text-slate-400 mt-1">Extrême 🔥</div>
                                    </div>
                                </button>
                            </div>

                            {/* START BUTTON */}
                            <div className="space-y-3">
                                <Button
                                    size="lg"
                                    disabled={!selectedDifficulty}
                                    onClick={handleStartDailyChallenge}
                                    className={cn(
                                        "w-full font-black text-sm uppercase tracking-widest shadow-lg transition-all duration-300",
                                        selectedDifficulty === AI_DIFFICULTY.BONUS
                                            ? "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-500/25"
                                            : selectedDifficulty === AI_DIFFICULTY.HARD
                                                ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/25"
                                                : "bg-slate-800 text-white/40 cursor-not-allowed shadow-none disabled:opacity-100"
                                    )}
                                >
                                    {selectedDifficulty ? "Commencer le défi" : "Sélectionnez une difficulté"}
                                </Button>

                                <p className="text-sm text-center text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                                    <strong className="text-[#F43F5E]">Attention :</strong> La victoire est impérative pour remporter les XP bonus.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Weekly Challenge Announcement Modal */}
            {showWeeklyAnnouncement && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        onClick={handleCloseAnnouncement}
                    />
                    
                    <Motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="relative w-full max-w-sm overflow-hidden"
                    >
                        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-400/30 rounded-[2.5rem] shadow-2xl p-8 text-center relative">
                            {/* Decorative elements */}
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/15 via-amber-500/5 to-transparent pointer-events-none" />
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/15 blur-3xl rounded-full" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/15 blur-3xl rounded-full" />

                            {/* Icon */}
                            <div className="relative mb-6 inline-block">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-violet-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 transform -rotate-6">
                                    <span className="text-4xl animate-float-3d">{CURRENT_WEEKLY_CHALLENGE.icon}</span>
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center border-4 border-slate-900">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                            </div>

                            {/* Text content */}
                            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">{CURRENT_WEEKLY_CHALLENGE.title}</h2>
                            <p className="text-indigo-300 font-bold text-sm uppercase tracking-widest mb-6">{CURRENT_WEEKLY_CHALLENGE.subtitle}</p>
                            
                            <div className="space-y-4 mb-8 text-center">
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    Entre ombre et lumière, trouvez l'équilibre ! En <strong className="text-violet-400">mode Tourment</strong>, gardez au moins <strong className="text-white">1 carte "-2", 2 cartes "0" et 1 carte "2"</strong> sur votre grille finale, puis <strong className="text-white">remportez la victoire</strong> contre l'IA.
                                </p>
                                <p className="text-[10px] text-indigo-300/80 font-bold italic -mt-2">
                                    (Attention : évitez d'aligner 3 cartes identiques dans une même colonne, sinon elles seront supprimées !)
                                </p>

                                <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-2xl py-3 px-4 inline-flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-indigo-500 text-white flex items-center justify-center font-black shadow-lg">
                                        +{CURRENT_WEEKLY_CHALLENGE.rewardXP}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-xs uppercase tracking-wider text-indigo-300">Récompense</div>
                                        <div className="text-white font-black text-sm">Points d'XP</div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <Button 
                                onClick={handleCloseAnnouncement}
                                className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-amber-500 hover:from-indigo-500 hover:to-amber-400 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 border-t border-white/30"
                            >
                                C'est parti !
                            </Button>

                            <p className="mt-4 text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                                Disponible chaque semaine • Reset : 7 jours
                            </p>
                        </div>
                    </Motion.div>
                </div>,
                document.body
            )}
        </div>
    );
}
