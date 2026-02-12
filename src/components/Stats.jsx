import { useMemo, useRef, useState } from 'react';
import { Trophy, Target, Award, Flame, Users, Download, Upload, Crown, Medal, Star, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, selectGameHistory } from '../store/gameStore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

// Palette de couleurs pour les joueurs (forced dark theme)
const PLAYER_COLORS = [
    { bg: 'bg-emerald-500', light: 'bg-emerald-900/30', text: 'text-emerald-300', stroke: '#10b981' },
    { bg: 'bg-[#1A4869]', light: 'bg-[#1A4869]/30', text: 'text-sky-300', stroke: '#38bdf8' },
    { bg: 'bg-purple-500', light: 'bg-purple-900/30', text: 'text-purple-300', stroke: '#a855f7' },
    { bg: 'bg-amber-500', light: 'bg-amber-900/30', text: 'text-amber-300', stroke: '#f59e0b' },
    { bg: 'bg-rose-500', light: 'bg-rose-900/30', text: 'text-rose-300', stroke: '#f43f5e' },
    { bg: 'bg-cyan-500', light: 'bg-cyan-900/30', text: 'text-cyan-300', stroke: '#06b6d4' },
    { bg: 'bg-orange-500', light: 'bg-orange-900/30', text: 'text-orange-300', stroke: '#f97316' },
    { bg: 'bg-pink-500', light: 'bg-pink-900/30', text: 'text-pink-300', stroke: '#ec4899' },
];

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

/**
 * Podium Component for Top 3
 */
const Podium = ({ players }) => {
    // Ensure we have at least 3 spots (filled with nulls if fewer players)
    const top3 = [players[1], players[0], players[2]]; // Silver, Gold, Bronze order
    const heights = ['h-32', 'h-48', 'h-24']; // Heights for pillars
    const gradients = [
        'from-slate-400/20 via-slate-500/10 to-transparent border-t-2 border-slate-300/30', // Silver
        'from-amber-400/30 via-amber-500/10 to-transparent border-t-2 border-amber-300/40 shadow-[0_-20px_40px_rgba(251,191,36,0.1)]', // Gold
        'from-orange-800/20 via-orange-900/10 to-transparent border-t-2 border-orange-600/30' // Bronze
    ];
    const delays = [0.2, 0, 0.4];

    return (
        <div className="flex items-end justify-center gap-2 sm:gap-4 h-64 mb-12 pt-6">
            {top3.map((player, index) => {
                if (!player) return <div key={index} className="w-24 sm:w-32" />; // Spacer

                return (
                    <motion.div
                        key={player.name}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: delays[index], type: "spring", stiffness: 100 }}
                        className="flex flex-col items-center w-24 sm:w-32 relative group"
                    >
                        {/* Avatar Circle */}
                        <div className={cn(
                            "mb-3 p-1 rounded-full border-2 bg-slate-950 z-10 relative transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2",
                            index === 1 ? "w-20 h-20 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]" :
                                index === 0 ? "w-16 h-16 border-slate-400" : "w-14 h-14 border-orange-700"
                        )}>
                            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-black text-xl text-white overflow-hidden uppercase">
                                {player.name.substring(0, 2)}
                            </div>
                            {index === 1 && (
                                <Crown className="absolute -top-7 left-1/2 -translate-x-1/2 w-8 h-8 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] animate-pulse" />
                            )}
                        </div>

                        {/* Pillar */}
                        <div className={cn(
                            "w-full rounded-t-2xl bg-gradient-to-b flex flex-col items-center justify-start pt-4 relative overflow-hidden",
                            heights[index],
                            gradients[index]
                        )}>
                            <span className={cn(
                                "text-4xl font-black italic opacity-30",
                                index === 1 ? "text-amber-400" : index === 0 ? "text-slate-200" : "text-orange-500"
                            )}>
                                {index === 1 ? '1' : index === 0 ? '2' : '3'}
                            </span>
                            <div className="mt-auto pb-4 w-full text-center px-1">
                                <p className="text-[10px] font-black text-white/90 uppercase tracking-widest truncate w-full px-2">{player.name}</p>
                                <p className="text-[9px] text-white/40 font-bold uppercase tracking-tighter">{player.wins} victoires</p>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

// Stat Card Component
function StatCard({ icon: Icon, title, value, subtitle, colorClass = 'text-skyjo-blue', className }) {
    return (
        <motion.div variants={itemVariants} className="h-full">
            <div className={cn("glass-premium p-4 rounded-2xl h-full border border-white/5 hover:border-white/10 transition-all duration-500 group", className)}>
                <div className="flex items-center gap-3 mb-3">
                    <div className={cn("p-2 rounded-lg bg-white/5", colorClass)}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                        {title}
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-black text-white tracking-tighter">
                        {value}
                    </div>
                    {subtitle && (
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tight truncate">
                            {subtitle}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// Player Leaderboard Item
function LeaderboardItem({ player, rank, wins, avgScore, colorIndex }) {
    const color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];

    return (
        <motion.div
            variants={itemVariants}
            className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-300"
        >
            {/* Rank Badge */}
            <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg",
                rank === 0 ? "bg-amber-400 text-amber-950" :
                    rank === 1 ? "bg-slate-300 text-slate-900" :
                        rank === 2 ? "bg-orange-500 text-white" :
                            "bg-slate-800 text-slate-500"
            )}>
                {rank + 1}
            </div>

            {/* Player Info */}
            <div className="flex-1">
                <div className={cn("font-black text-white uppercase tracking-tight")}>{player.name}</div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">
                    <span className="flex items-center gap-1">
                        MOY. {avgScore.toFixed(0)} pts
                    </span>
                    <span className="flex items-center gap-1">
                        {player.gamesPlayed} parties
                    </span>
                </div>
            </div>

            {/* Wins */}
            <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xl font-black text-white">{wins}</span>
                    <Trophy className="w-4 h-4 text-skyjo-blue" />
                </div>
                <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Victoires</div>
            </div>
        </motion.div>
    );
}

export default function Stats() {
    const gameHistory = useGameStore(selectGameHistory);
    const fileInputRef = useRef(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const { playerStats, totalGames, bestScore } = useMemo(() => {
        const stats = {};
        let absoluteBest = Infinity;

        gameHistory.forEach(game => {
            game.players.forEach(p => {
                if (!stats[p.name]) {
                    stats[p.name] = {
                        name: p.name,
                        wins: 0,
                        gamesPlayed: 0,
                        totalScore: 0
                    };
                }
                stats[p.name].gamesPlayed += 1;
                stats[p.name].totalScore += p.finalScore;

                if (p.finalScore < absoluteBest) absoluteBest = p.finalScore;
                if (game.winner.name === p.name) {
                    stats[p.name].wins += 1;
                }
            });
        });

        const sortedStats = Object.values(stats).sort((a, b) => b.wins - a.wins);
        return {
            playerStats: sortedStats,
            totalGames: gameHistory.length,
            bestScore: absoluteBest === Infinity ? 0 : absoluteBest
        };
    }, [gameHistory]);

    // Limit displayed players when collapsed
    const displayedPlayers = isExpanded ? playerStats : playerStats.slice(0, 5);

    const handleExport = () => {
        const exportData = {
            version: 1,
            exportDate: new Date().toISOString(),
            gameHistory: gameHistory
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `skyjo-pantheon-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.gameHistory && Array.isArray(data.gameHistory)) {
                    const existingIds = new Set(gameHistory.map(g => g.id));
                    const newGames = data.gameHistory.filter(g => !existingIds.has(g.id));
                    if (newGames.length > 0) {
                        useGameStore.setState(state => ({
                            gameHistory: [...newGames, ...state.gameHistory].slice(0, 50)
                        }));
                        alert(`${newGames.length} partie(s) importée(s) !`);
                    } else {
                        alert('Toutes les parties sont déjà présentes.');
                    }
                }
            } catch (err) {
                alert('Erreur lors de la lecture du fichier.');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    return (
        <div className="space-y-12 pb-32">
            {/* Minimalist Hero Header */}
            <div className="relative text-center pt-12 pb-4">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-32 bg-skyjo-blue/5 blur-[80px] rounded-full pointer-events-none" />
                <h1 className="relative text-5xl font-black text-white tracking-tighter drop-shadow-2xl">
                    PANTHÉON
                </h1>
                <div className="flex items-center justify-center gap-4 mt-2">
                    <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/20" />
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">
                        Élite & Légendes
                    </p>
                    <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/20" />
                </div>
            </div>

            {gameHistory.length === 0 ? (
                <div className="glass-premium border-white/10 p-20 text-center rounded-3xl">
                    <Trophy className="h-12 w-12 text-slate-800 mx-auto mb-4" />
                    <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Vide</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Jouez pour forger votre légende</p>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-12 px-2"
                >
                    {/* PODIUM Section (Top 3) */}
                    {playerStats.length > 0 && (
                        <div className="relative">
                            <Podium players={playerStats.slice(0, 3)} />
                        </div>
                    )}

                    {/* Highly Focused Stat Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard
                            icon={Trophy}
                            title="Total Parties"
                            value={totalGames}
                            colorClass="text-amber-400"
                        />
                        <StatCard
                            icon={Target}
                            title="Record Absolu"
                            value={bestScore}
                            subtitle="Plus bas score"
                            colorClass="text-emerald-400"
                        />
                        <StatCard
                            icon={Flame}
                            title="Leader Actuel"
                            value={playerStats[0]?.name || "-"}
                            subtitle={`${playerStats[0]?.wins || 0} victoires`}
                            colorClass="text-orange-500"
                        />
                        <StatCard
                            icon={Users}
                            title="Communauté"
                            value={playerStats.length}
                            subtitle="Joueurs uniques"
                            colorClass="text-skyjo-blue"
                        />
                    </div>

                    {/* Compact Leaderboard List */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-4">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                <Medal className="w-3 h-3 text-amber-500" />
                                Palmarès Détaillé
                            </h3>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                {playerStats.length} Joueurs
                            </span>
                        </div>
                        <div className="space-y-3 relative">
                            <AnimatePresence initial={false}>
                                <motion.div
                                    className="space-y-3 overflow-hidden"
                                    initial={false}
                                    animate={{ height: "auto" }}
                                    transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
                                >
                                    {displayedPlayers.map((player, index) => (
                                        <LeaderboardItem
                                            key={player.name}
                                            player={player}
                                            rank={index}
                                            wins={player.wins}
                                            avgScore={player.totalScore / player.gamesPlayed}
                                            colorIndex={index}
                                        />
                                    ))}
                                </motion.div>
                            </AnimatePresence>

                            {playerStats.length > 5 && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all group"
                                >
                                    <span>{isExpanded ? "RÉDUIRE LA LISTE" : "VOIR TOUT LE PALMARÈS"}</span>
                                    <ChevronDown className={cn(
                                        "w-4 h-4 transition-transform duration-500",
                                        isExpanded ? "rotate-180" : "rotate-0"
                                    )} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Discreet Data Actions */}
                    <div className="flex justify-center gap-4 pt-8 opacity-40 hover:opacity-100 transition-opacity">
                        <input type="file" ref={fileInputRef} accept=".json" onChange={handleImport} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="text-[9px] font-bold text-slate-500 uppercase tracking-widest hover:text-white flex items-center gap-2">
                            <Upload className="h-3 w-3" /> Importer
                        </button>
                        <button onClick={handleExport} className="text-[9px] font-bold text-slate-500 uppercase tracking-widest hover:text-white flex items-center gap-2">
                            <Download className="h-3 w-3" /> Exporter
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
