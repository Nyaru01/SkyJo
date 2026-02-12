import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Bot, ChevronRight, Users, Wifi, HelpCircle, Palette, X, Sparkles, RotateCcw, Zap, Swords, Flame, Image as ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { PremiumTiltButton } from './ui/PremiumTiltButton';
import SkinCarousel from './SkinCarousel';
import ExperienceBar from './ExperienceBar';
import { useVirtualGameStore } from '../store/virtualGameStore';
import { useGameStore, selectIsDailyAvailable } from '../store/gameStore';
import { useOnlineGameStore } from '../store/onlineGameStore';
import { useFeedback } from '../hooks/useFeedback';
import { cn } from '../lib/utils';
import { AI_DIFFICULTY } from '../lib/skyjoAI';

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
    const { playClick } = useFeedback();

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
        <div className="max-w-md mx-auto p-4 space-y-4 min-h-[600px] flex flex-col pt-8">
            {/* Sticky header + progression */}
            <div className="sticky top-0 z-20 bg-gradient-to-b from-slate-950 via-slate-950/95 to-transparent pb-4 -mx-4 px-4 pt-4 -mt-4 rounded-t-[2.5rem]">
                {/* Header section */}
                <div className="text-center mb-4 space-y-1">
                    <h2 className="text-3xl font-black text-white tracking-tighter">MODE VIRTUEL</h2>
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
                        contentClassName="h-auto pl-8 pr-6"
                    >
                        <div className="flex items-center justify-between w-full relative z-10">
                            <div className="text-left">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <RotateCcw className="h-5 w-5 animate-spin-slow" />
                                    REPRENDRE LA PARTIE
                                </h3>
                                <p className="text-[10px] text-emerald-100 font-medium uppercase tracking-wider mt-1">
                                    Continuez votre combat contre l'IA
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center">
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
                    contentClassName="h-auto pl-8 pr-6"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between w-full relative z-10 text-left">
                        <div className="flex flex-col justify-center">
                            <h3 className="text-lg font-bold text-white leading-tight">
                                JOUER CONTRE L'IA
                            </h3>
                            <p className="text-[10px] text-indigo-200 font-bold uppercase mt-0.5 tracking-wide">
                                Entraînez-vous en solo
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/30 border border-purple-400/50 flex items-center justify-center shrink-0">
                            <Bot className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
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
                    contentClassName="h-auto pl-8 pr-6"
                >
                    <div className="flex items-center justify-between w-full relative z-10 text-left">
                        <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-white leading-tight">DÉFI QUOTIDIEN</h3>
                                {isDailyAvailable && (
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                                )}
                            </div>
                            <p className={cn(
                                "text-[10px] font-bold uppercase tracking-wider mt-0.5",
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
                            "w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-500 relative overflow-hidden shrink-0",
                            isDailyAvailable
                                ? "bg-amber-500/20 border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                                : "bg-slate-800/50 border-white/5"
                        )}>
                            {isDailyAvailable && (
                                <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 to-transparent animate-pulse" />
                            )}
                            <Zap className={cn(
                                "h-6 w-6 transition-all duration-500",
                                isDailyAvailable ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-slate-600"
                            )} />
                        </div>
                    </div>
                </PremiumTiltButton>

                <PremiumTiltButton
                    onClick={handleStartOnline}
                    gradientFrom="from-sky-600"
                    gradientTo="to-blue-600"
                    shadowColor="shadow-sky-500/20"
                    className="w-full"
                    contentClassName="h-auto pl-8 pr-6"
                >
                    <div className="flex items-center justify-between w-full relative z-10 text-left">
                        <div className="flex flex-col justify-center">
                            <h3 className="text-lg font-bold text-white leading-tight">JOUER EN LIGNE</h3>
                            <p className="text-[10px] text-blue-100/90 font-bold uppercase mt-0.5 tracking-wide">Affrontez vos amis à distance</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-sky-500/30 border border-sky-400/50 flex items-center justify-center shrink-0">
                            <Wifi className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                        </div>
                    </div>
                </PremiumTiltButton>

                {/* Rules Button */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setShowRulesModal(true)}
                        className="flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-white/10 transition-all active:scale-95 group backdrop-blur-md"
                    >
                        <HelpCircle className="h-5 w-5 text-amber-500" />
                        <span className="font-bold text-slate-200">Règles</span>
                    </button>
                    <button
                        onClick={() => {
                            playClick();
                            // Navigation to settings via Dashboard needs to be handled if Dashboard is the parent
                            // However, we just need to trigger the tab change
                            // Since Dashboard manages activeTab, we can use useGameStore to set it if we expose it
                            // Or simpler: just let user go to Settings via Navbar as usual, 
                            // OR we can use the prop setScreen if it supports 'settings'? 
                            // Let's check Dashboard. 
                            // Dashboard uses setActiveTab which is local to it.
                            // But gameStore has setActiveTab(tab) which Dashboard syncs to!
                            useGameStore.getState().setActiveTab('settings');
                        }}
                        className="flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-white/10 transition-all active:scale-95 group backdrop-blur-md"
                    >
                        <ImageIcon className="h-5 w-5 text-indigo-400" />
                        <span className="font-bold text-slate-200">Fond</span>
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
                            { id: 'galaxy', name: 'Galaxy', img: '/card-back-galaxy.png', level: 18 }
                        ]}
                        selectedSkinId={playerCardSkin}
                        onSelect={setCardSkin}
                        playerLevel={playerLevel}
                    />
                </CardContent>
            </Card>

            {/* Rules Modal */}
            {showRulesModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setShowRulesModal(false)}
                    />
                    <div className="relative w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
                        {/* Background Gradients */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

                        {/* Header */}
                        <div className="relative p-6 px-8 border-b border-white/5 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
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
                    </div>
                </div>
            )}

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

                        {/* Header */}
                        <div className="pt-6 pb-2 text-center relative z-10">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex flex-col items-center justify-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F43F5E] to-rose-600 shadow-lg shadow-[#F43F5E]/30 flex items-center justify-center mb-1 animate-pulse-slow">
                                    <Zap className="w-7 h-7 text-white fill-white" />
                                </div>
                                <span>Défi Quotidien</span>
                            </h2>
                            <button
                                onClick={() => setShowDailyChallengeModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
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
                                            +4 XP
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
                                            +8 XP
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
        </div>
    );
}
