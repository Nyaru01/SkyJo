import SeasonalChallengeButton from './ui/SeasonalChallengeButton';
import { useSeasonalClock } from '../hooks/useSeasonalClock';
import { getActiveWeeklyChallenge } from '../lib/weeklyChallenge';
import React from 'react';
import { Bot, Check, ChevronRight, Wifi, HelpCircle, Palette, X, Sparkles, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import SkinCarousel from './SkinCarousel';
import ExperienceBar from './ExperienceBar';
import { useVirtualGameStore } from '../store/virtualGameStore';
import { useGameStore, selectIsDailyAvailable } from '../store/gameStore';
import { useOnlineGameStore } from '../store/onlineGameStore';
import { useFeedback } from '../hooks/useFeedback';
import { cn } from '../lib/utils';
import { AI_DIFFICULTY } from '../lib/skyjoAI';
import ModalShell from './ui/ModalShell';
import DailyChallengeDialog from './DailyChallengeDialog';
import '../styles/GameMenu.css';


export default function GameMenu({
    initialFocus,
    onInitialFocusHandled,
    setScreen,
    playerCardSkin,
    playerLevel,
    setCardSkin
}) {
    const [showRulesModal, setShowRulesModal] = React.useState(false);
    const [showDailyChallengeModal, setShowDailyChallengeModal] = React.useState(false);
    const [selectedDifficulty, setSelectedDifficulty] = React.useState(null);
    const challengeSectionRef = React.useRef(null);

    React.useEffect(() => {
        if (initialFocus !== 'challenges') return;
        // On attend la fin de la transition de page, sinon la mise en page bouge encore et le centrage tombe à côté.
        const t = setTimeout(() => {
            challengeSectionRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            challengeSectionRef.current?.focus({ preventScroll: true });
            onInitialFocusHandled?.();
        }, 380);
        return () => clearTimeout(t);
    }, [initialFocus, onInitialFocusHandled]);

    const virtualGameState = useVirtualGameStore(state => state.gameState);
    const startAIGame = useVirtualGameStore(state => state.startAIGame);
    const userProfile = useGameStore(state => state.userProfile);
    const connectOnline = useOnlineGameStore(state => state.connect);
    const setPlayerInfo = useOnlineGameStore(state => state.setPlayerInfo);
    const isDailyAvailable = useGameStore(selectIsDailyAvailable);
    const now = useSeasonalClock();
    const challenge = getActiveWeeklyChallenge(now);
    const seasonalChallengeWins = useGameStore(state => state.seasonalChallengeWins);
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
        <div className="play-menu max-w-md mx-auto px-3 sm:px-4">
            <header className="play-menu-heading">
                <p className="play-menu-eyebrow">À VOUS DE JOUER</p>
                <h2>Une nouvelle partie ?</h2>
                <p>Votre table, votre rythme.</p>
            </header>

            <section className="play-menu-modes" aria-label="Choisir un mode de jeu">
                {virtualGameState && (
                    <button type="button" className="play-menu-action play-menu-action--primary" onClick={() => {
                        playClick();
                        setScreen('game');
                    }}>
                        <span className="play-menu-action-icon"><RotateCcw aria-hidden="true" /></span>
                        <span className="play-menu-action-copy">
                            <span className="play-menu-action-kicker">PARTIE EN COURS</span>
                            <span className="play-menu-action-title">Reprendre la partie</span>
                            <span className="play-menu-action-description">Retrouvez votre table.</span>
                        </span>
                        <ChevronRight className="play-menu-arrow" aria-hidden="true" />
                    </button>
                )}
                <button type="button" className={cn('play-menu-action', !virtualGameState && 'play-menu-action--primary')} onClick={handleStartAIBattle}>
                    <span className="play-menu-action-icon"><Bot aria-hidden="true" /></span>
                    <span className="play-menu-action-copy">
                        {!virtualGameState && <span className="play-menu-action-kicker">À VOTRE RYTHME</span>}
                        <span className="play-menu-action-title">Jouer contre l’IA</span>
                        <span className="play-menu-action-description">Tourment ou Fury, à vous de choisir.</span>
                    </span>
                    <ChevronRight className="play-menu-arrow" aria-hidden="true" />
                </button>
                <button type="button" className="play-menu-action" onClick={handleStartOnline}>
                    <span className="play-menu-action-icon"><Wifi aria-hidden="true" /></span>
                    <span className="play-menu-action-copy">
                        <span className="play-menu-action-title">Jouer en ligne</span>
                        <span className="play-menu-action-description">Une table à partager entre amis.</span>
                    </span>
                    <ChevronRight className="play-menu-arrow" aria-hidden="true" />
                </button>
            </section>

            <section ref={challengeSectionRef} tabIndex={-1} className="play-menu-challenges" aria-labelledby="play-menu-challenges-title">
                <div className="play-menu-section-heading">
                    <h3 id="play-menu-challenges-title">Les rendez-vous</h3>
                    <span>Défis & bonus XP</span>
                </div>
                <button type="button" className={`play-menu-action play-menu-action--daily${isDailyAvailable ? '' : ' is-done'}`} disabled={!isDailyAvailable} onClick={() => {
                    if (!isDailyAvailable) return;
                    playClick();
                    setShowDailyChallengeModal(true);
                }}>
                    {/* Icône : une page d'éphéméride avec le jour du mois */}
                    <span className="play-menu-action-icon daily-calendar" aria-hidden="true"><i /><b>{now.getDate()}</b><small>{now.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}</small></span>
                    <span className="play-menu-action-copy">
                        <span className="play-menu-action-title">Défi quotidien</span>
                        <span className="play-menu-action-description">{isDailyAvailable ? 'Gagnez une partie aujourd’hui contre l’IA.' : `Défi réussi. Le prochain dans ${24 - now.getHours()} h.`}</span>
                    </span>
                    {isDailyAvailable
                        ? <span className="daily-reward"><b>+6</b><small>XP max</small></span>
                        : <span className="daily-done"><Check size={14} strokeWidth={3} aria-hidden="true" />Fait</span>}
                </button>
                <SeasonalChallengeButton
                    calm
                    rewardState={{ weeklyChallengeWinDate, weeklyChallengeId, seasonalChallengeWins }}
                    onClick={() => {
                        playClick();
                        const started = startAIGame({ name: userProfile.name, avatarId: userProfile.avatarId }, 1, AI_DIFFICULTY.BONUS, { isBonusMode: true, isWeeklyChallenge: true });
                        if (started !== false) setScreen('game');
                        return started;
                    }}
                />
            </section>

            <section className="play-menu-career" aria-label="Votre progression">
                <div className="play-menu-section-heading"><h3>Votre progression</h3></div>
                <ExperienceBar />
            </section>

            <div className="play-menu-tools">
                <button type="button" onClick={() => setShowRulesModal(true)}>
                    <HelpCircle aria-hidden="true" /><span>Règles du jeu</span>
                </button>
                <button type="button" onClick={() => {
                    playClick();
                    useGameStore.getState().setIsWallpaperModalOpen(true);
                }}>
                    <ImageIcon aria-hidden="true" /><span>Fond de table</span>
                </button>
            </div>

            {/* Customization Card */}
            <Card className="play-menu-customization relative overflow-hidden">
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
                            { id: 'classic', name: 'Classique', img: '/card-backs/classic.svg', level: 1 },
                            { id: 'papyrus', name: 'Papyrus', img: '/card-backs/papyrus.svg', level: 3 },
                            { id: 'neon', name: 'Neon', img: '/card-backs/neon.svg', level: 5 },
                            { id: 'cyberpunk', name: 'Cyberpunk', img: '/card-backs/cyberpunk.svg', level: 6 },
                            { id: 'carbon', name: 'Carbon', img: '/card-backs/carbon.svg', level: 8 },
                            { id: 'obsidian', name: 'Obsidian', img: '/card-backs/obsidian.svg', level: 12 },
                            { id: 'gold', name: 'Gold', img: '/card-backs/gold.svg', level: 13 },
                            { id: 'galaxy', name: 'Galaxy', img: '/card-backs/galaxy.svg', level: 18 },
                            { id: 'astral-sigil', name: 'Sceau Astral', img: '/card-backs/astral-sigil.svg', level: 110 },
                            { id: 'nebula-core', name: 'Cœur de Nébuleuse', img: '/card-backs/nebula-core.svg', level: 130 },
                            { id: 'cosmic-dragon', name: 'Dragon Cosmique', img: '/card-backs/cosmic-dragon.svg', level: 150 },
                            { id: 'eternal-prism', name: 'Prisme Éternel', img: '/card-backs/eternal-prism.svg', level: 170 },
                            { id: 'transcendent-void', name: 'Vide Transcendant', img: '/card-backs/transcendent-void.svg', level: 190 }
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
                                    <span className="text-3xl">📜</span> Règles de Vesper
                                </h2>
                                <p className="text-xs font-medium text-white/40 uppercase tracking-widest mt-1">Manuel de jeu officiel v2.0</p>
                            </div>
                            <button
                                onClick={() => setShowRulesModal(false)}
                                aria-label="Fermer les règles"
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

            <DailyChallengeDialog
                isOpen={showDailyChallengeModal}
                onClose={() => setShowDailyChallengeModal(false)}
                difficulty={selectedDifficulty}
                onDifficultyChange={difficulty => { playClick(); setSelectedDifficulty(difficulty); }}
                onStart={handleStartDailyChallenge}
            />

            {/* Weekly Challenge Announcement Modal */}
            <ModalShell isOpen={showWeeklyAnnouncement && !!challenge} onClose={handleCloseAnnouncement} labelledBy="weekly-announcement-title" className="menu-dialog-shell" maxWidth="max-w-sm">
                        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-400/30 rounded-[2.5rem] shadow-2xl p-8 text-center relative">
                            {/* Decorative elements */}
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/15 via-amber-500/5 to-transparent pointer-events-none" />
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/15 blur-3xl rounded-full" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/15 blur-3xl rounded-full" />

                            {/* Icon */}
                            <div className="relative mb-6 inline-block">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-violet-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 transform -rotate-6">
                                    <span className="text-4xl animate-float-3d">{challenge?.icon}</span>
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center border-4 border-slate-900">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                            </div>

                            {/* Text content */}
                            <h2 id="weekly-announcement-title" className="text-2xl font-black text-white mb-2 tracking-tight">{challenge?.title}</h2>
                            <p className="text-indigo-300 font-bold text-sm uppercase tracking-widest mb-6">{challenge?.subtitle}</p>
                            
                            <div className="space-y-4 mb-8 text-center">
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    En mode Tourment : <strong className="text-white">{challenge?.requirementLabel}</strong>, puis obtenez le meilleur score contre l’IA en une manche. Les égalités comptent.
                                </p>
                                <p className="text-[10px] text-indigo-300/80 font-bold italic -mt-2">
                                    Une récompense tous les sept jours. Réessayez immédiatement après une défaite.
                                </p>

                                <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-2xl py-3 px-4 inline-flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-indigo-500 text-white flex items-center justify-center font-black shadow-lg">
                                        +{challenge?.rewardXP}
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
            </ModalShell>

        </div>
    );
}
